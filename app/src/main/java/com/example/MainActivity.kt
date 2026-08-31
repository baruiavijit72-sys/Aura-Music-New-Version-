package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.state.AppScreen
import com.example.state.AuraViewModel
import com.example.ui.components.*
import com.example.ui.screens.*
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val auraViewModel: AuraViewModel = viewModel()
            val context = LocalContext.current

            LaunchedEffect(Unit) {
                auraViewModel.setAppContext(context)
            }

            var isSplashVisible by remember { mutableStateOf(true) }
            var isAuthenticated by remember { mutableStateOf(false) }

            // Permission Launcher for auto-scanning local songs
            val permissionLauncher = rememberLauncherForActivityResult(
                contract = ActivityResultContracts.RequestMultiplePermissions()
            ) { permissions ->
                val audioGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    permissions[Manifest.permission.READ_MEDIA_AUDIO] == true
                } else {
                    permissions[Manifest.permission.READ_EXTERNAL_STORAGE] == true
                }
                if (audioGranted) {
                    auraViewModel.scanDeviceStorage(context)
                }
            }

            // Function to trigger permission check
            val triggerStoragePermissionCheck = {
                val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.READ_MEDIA_AUDIO
                    ) == PackageManager.PERMISSION_GRANTED
                } else {
                    ContextCompat.checkSelfPermission(
                        context,
                        Manifest.permission.READ_EXTERNAL_STORAGE
                    ) == PackageManager.PERMISSION_GRANTED
                }

                if (hasPermission) {
                    auraViewModel.scanDeviceStorage(context)
                } else {
                    val permissionsToRequest = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        arrayOf(Manifest.permission.READ_MEDIA_AUDIO)
                    } else {
                        arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE)
                    }
                    permissionLauncher.launch(permissionsToRequest)
                }
            }

            MyApplicationTheme(themeMode = auraViewModel.appThemeMode) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    when {
                        isSplashVisible -> {
                            DisneyHotstarSplashScreen(
                                onSplashComplete = {
                                    isSplashVisible = false
                                }
                            )
                        }
                        !isAuthenticated -> {
                            AuthenticationScreen(
                                onAuthenticate = { provider ->
                                    auraViewModel.switchAccount(provider)
                                    isAuthenticated = true
                                    triggerStoragePermissionCheck()
                                }
                            )
                        }
                        else -> {
                            AuraMainApp(viewModel = auraViewModel)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun DisneyHotstarSplashScreen(onSplashComplete: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "stardust")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.05f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val arcAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(2400, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "arc"
    )

    LaunchedEffect(Unit) {
        delay(1800)
        onSplashComplete()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(
                        Color(0xFF0F172A),
                        Color(0xFF070B14),
                        Color(0xFF030712)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(130.dp)
                    .scale(pulseScale),
                contentAlignment = Alignment.Center
            ) {
                // Multi-color neon aura halo
                Box(
                    modifier = Modifier
                        .size(124.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.sweepGradient(
                                listOf(
                                    Color(0xFF06B6D4),
                                    Color(0xFF6366F1),
                                    Color(0xFFEC4899),
                                    Color(0xFFFFD700),
                                    Color(0xFF06B6D4)
                                )
                            )
                        )
                )
                Box(
                    modifier = Modifier
                        .size(112.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF090D16)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "Aura Music",
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(56.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "AURA MUSIC",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Black,
                    letterSpacing = 6.sp
                ),
                color = Color.White
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Lossless Sound • Hi-Res Acoustic Engine",
                style = MaterialTheme.typography.bodySmall.copy(letterSpacing = 1.sp),
                color = Color(0xFFA1A1AA)
            )

            Spacer(modifier = Modifier.height(36.dp))

            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = Color(0xFF06B6D4),
                strokeWidth = 2.5.dp
            )
        }
    }
}

@Composable
fun AuthenticationScreen(onAuthenticate: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isRegisterMode by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF0F172A),
                        Color(0xFF090D16),
                        Color(0xFF000000)
                    )
                )
            )
            .padding(24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            listOf(Color(0xFF6366F1), Color(0xFF06B6D4))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.MusicNote,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(36.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = if (isRegisterMode) "Create Aura Account" else "Welcome to Aura Music",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = Color.White
            )

            Text(
                text = "Sign in to sync your playlists and listening insights",
                style = MaterialTheme.typography.bodySmall,
                color = Color.LightGray,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Google Sign In Button
            Button(
                onClick = { onAuthenticate("Google") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.AccountCircle,
                        contentDescription = null,
                        tint = Color(0xFF1E293B),
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Continue with Google",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF1E293B)
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                Text(
                    text = "  OR  ",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
                HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
            }

            Spacer(modifier = Modifier.height(14.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email Address") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(10.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    onAuthenticate(if (email.isNotBlank()) email else "EmailUser")
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
            ) {
                Text(
                    text = if (isRegisterMode) "Create Account" else "Sign In",
                    style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // 1-Tap Offline Guest Mode Button
            OutlinedButton(
                onClick = { onAuthenticate("Guest") },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CloudOff,
                        contentDescription = null,
                        tint = AuraSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "Continue in Guest Mode (Offline)",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = AuraSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            TextButton(onClick = { isRegisterMode = !isRegisterMode }) {
                Text(
                    text = if (isRegisterMode) "Already have an account? Sign In" else "Don't have an account? Register",
                    style = MaterialTheme.typography.bodySmall,
                    color = AuraSecondary
                )
            }
        }
    }
}

@Composable
fun AuraMainApp(viewModel: AuraViewModel) {
    // Intercept back button if Now Playing is expanded or user is in sub-screens
    BackHandler(
        enabled = viewModel.isNowPlayingExpanded ||
                viewModel.currentScreen != AppScreen.HOME ||
                viewModel.selectedPlaylistId != null
    ) {
        if (viewModel.isNowPlayingExpanded) {
            viewModel.isNowPlayingExpanded = false
        } else if (viewModel.selectedPlaylistId != null) {
            viewModel.selectedPlaylistId = null
        } else {
            viewModel.goBack()
        }
    }

    val currentScreen = viewModel.currentScreen

    val screenTitle = when (currentScreen) {
        AppScreen.HOME -> "Aura Music"
        AppScreen.LIBRARY -> "Audio Library"
        AppScreen.NOW_PLAYING -> "Now Playing"
        AppScreen.P2P_SHARE -> "P2P Music Transfer"
        AppScreen.PLAYLISTS -> "Playlists & Mixes"
        AppScreen.PLAYLIST_DETAIL -> "Playlist"
        AppScreen.ANALYTICS -> "Audio Insights & Stats"
        AppScreen.EQUALIZER -> "10-Band Graphic EQ"
        AppScreen.AUDIO_TRIMMER -> "Audio Trimmer & Ringtone"
        AppScreen.TAG_EDITOR -> "ID3 Tag Editor"
        AppScreen.PROFILE_CLOUD -> "Cloud Account & Backup"
        AppScreen.SYSTEM_WIDGETS -> "Widgets & System"
        AppScreen.SETTINGS -> "Settings"
    }

    val isTopLevel = currentScreen in listOf(
        AppScreen.HOME,
        AppScreen.LIBRARY,
        AppScreen.P2P_SHARE,
        AppScreen.PLAYLISTS,
        AppScreen.ANALYTICS
    )

    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            topBar = {
                TopNavBar(
                    viewModel = viewModel,
                    title = screenTitle,
                    showBackButton = !isTopLevel,
                    onBackClick = {
                        if (viewModel.selectedPlaylistId != null) {
                            viewModel.selectedPlaylistId = null
                        } else {
                            viewModel.goBack()
                        }
                    }
                )
            },
            bottomBar = {
                Column {
                    // Persistent Mini Player above the bottom navigation bar
                    if (viewModel.currentTrack != null && !viewModel.isNowPlayingExpanded) {
                        MiniPlayer(
                            viewModel = viewModel
                        )
                    }

                    // Bottom Navigation Bar for primary tabs
                    BottomNavBar(
                        currentScreen = currentScreen,
                        onNavigate = { viewModel.navigateTo(it) }
                    )
                }
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                AnimatedContent(
                    targetState = currentScreen,
                    label = "screen_transition"
                ) { target ->
                    when (target) {
                        AppScreen.HOME -> HomeScreen(viewModel = viewModel)
                        AppScreen.LIBRARY -> LibraryScreen(viewModel = viewModel)
                        AppScreen.NOW_PLAYING -> NowPlayingScreen(viewModel = viewModel)
                        AppScreen.P2P_SHARE -> P2PSharingScreen(viewModel = viewModel)
                        AppScreen.PLAYLISTS, AppScreen.PLAYLIST_DETAIL -> PlaylistsScreen(viewModel = viewModel)
                        AppScreen.ANALYTICS -> AnalyticsScreen(viewModel = viewModel)
                        AppScreen.EQUALIZER -> EqualizerScreen(viewModel = viewModel)
                        AppScreen.AUDIO_TRIMMER -> AudioTrimmerScreen(viewModel = viewModel)
                        AppScreen.TAG_EDITOR -> TagEditorScreen(viewModel = viewModel)
                        AppScreen.PROFILE_CLOUD -> ProfileCloudScreen(viewModel = viewModel)
                        AppScreen.SYSTEM_WIDGETS -> WidgetsAndSystemScreen(viewModel = viewModel)
                        AppScreen.SETTINGS -> SettingsScreen(viewModel = viewModel)
                    }
                }
            }
        }

        // Full Screen Immersive Now Playing Overlay
        AnimatedVisibility(
            visible = viewModel.isNowPlayingExpanded,
            enter = slideInVertically(initialOffsetY = { it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { it }) + fadeOut()
        ) {
            NowPlayingScreen(viewModel = viewModel)
        }

        // Queue Bottom Sheet
        if (viewModel.isQueueSheetVisible) {
            QueueSheet(
                viewModel = viewModel,
                onDismiss = { viewModel.isQueueSheetVisible = false }
            )
        }

        // Sleep Timer Dialog
        if (viewModel.isSleepTimerDialogVisible) {
            SleepTimerDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.isSleepTimerDialogVisible = false }
            )
        }
    }
}
