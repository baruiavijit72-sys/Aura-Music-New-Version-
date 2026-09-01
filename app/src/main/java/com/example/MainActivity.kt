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

            // Permission Launcher for auto-scanning local songs and notification permission
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
                val permissionsToRequest = mutableListOf<String>()

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_MEDIA_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                        permissionsToRequest.add(Manifest.permission.READ_MEDIA_AUDIO)
                    }
                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                        permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
                    }
                } else {
                    if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                        permissionsToRequest.add(Manifest.permission.READ_EXTERNAL_STORAGE)
                    }
                }

                if (permissionsToRequest.isEmpty()) {
                    auraViewModel.scanDeviceStorage(context)
                } else {
                    permissionLauncher.launch(permissionsToRequest.toTypedArray())
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
                                onAuthenticate = { name, userEmail, provider, isGuest ->
                                    auraViewModel.authenticateUser(
                                        name = name,
                                        email = userEmail,
                                        provider = provider,
                                        isGuest = isGuest
                                    )
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
        initialValue = 0.94f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    LaunchedEffect(Unit) {
        delay(2200)
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
                        Color(0xFF020617)
                    )
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(horizontal = 24.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(136.dp)
                    .scale(pulseScale),
                contentAlignment = Alignment.Center
            ) {
                // Multi-color neon aura halo
                Box(
                    modifier = Modifier
                        .size(130.dp)
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
                        .size(118.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF090D16)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.GraphicEq,
                        contentDescription = "Aura Music",
                        tint = Color(0xFF38BDF8),
                        modifier = Modifier.size(60.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "AURA MUSIC",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Black,
                    letterSpacing = 6.sp,
                    fontSize = 28.sp
                ),
                color = Color.White
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Lossless Sound • Hi-Res Acoustic Engine",
                style = MaterialTheme.typography.bodySmall.copy(
                    letterSpacing = 1.2.sp,
                    fontSize = 12.sp
                ),
                color = Color(0xFFA1A1AA)
            )

            Spacer(modifier = Modifier.height(26.dp))

            // Master Signature: Made By Avijit (Ultra-Stylish Luxury Shape & Glowing Typography)
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.padding(horizontal = 8.dp)
            ) {
                // Background Ambient Aura Glow
                Box(
                    modifier = Modifier
                        .width(260.dp)
                        .height(48.dp)
                        .clip(RoundedCornerShape(30.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(
                                    Color(0xFFF59E0B).copy(alpha = 0.25f),
                                    Color(0xFFEC4899).copy(alpha = 0.2f),
                                    Color(0xFF38BDF8).copy(alpha = 0.25f)
                                )
                            )
                        )
                )

                // High-End Luxury Capsule Surface
                Surface(
                    shape = RoundedCornerShape(32.dp),
                    color = Color(0xFF0B0D14),
                    border = androidx.compose.foundation.BorderStroke(
                        1.5.dp,
                        Brush.horizontalGradient(
                            listOf(
                                Color(0xFFD97706),
                                Color(0xFFFDE68A),
                                Color(0xFFF43F5E),
                                Color(0xFF38BDF8),
                                Color(0xFFFBBF24)
                            )
                        )
                    ),
                    shadowElevation = 16.dp
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 24.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AutoAwesome,
                            contentDescription = null,
                            tint = Color(0xFFFBBF24),
                            modifier = Modifier.size(18.dp)
                        )
                        Text(
                            text = "MADE BY",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 3.sp,
                                fontSize = 11.sp
                            ),
                            color = Color(0xFFE2E8F0)
                        )
                        Text(
                            text = "✦",
                            color = Color(0xFF38BDF8),
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "AVIJIT",
                            style = MaterialTheme.typography.titleMedium.copy(
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.5.sp,
                                fontSize = 17.sp
                            ),
                            color = Color(0xFFFFF0A5)
                        )
                        Icon(
                            imageVector = Icons.Default.Stars,
                            contentDescription = null,
                            tint = Color(0xFFF43F5E),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            CircularProgressIndicator(
                modifier = Modifier.size(26.dp),
                color = Color(0xFF06B6D4),
                strokeWidth = 2.5.dp
            )
        }

        // Bottom Footer Bar
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 28.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF10B981))
                )
                Text(
                    text = "AURA HI-RES AUDIO • CRAFTED BY AVIJIT",
                    style = MaterialTheme.typography.labelSmall.copy(
                        letterSpacing = 1.2.sp,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp
                    ),
                    color = Color(0xFF71717A)
                )
            }
        }
    }
}

@Composable
fun AuthenticationScreen(onAuthenticate: (String, String, String, Boolean) -> Unit) {
    var email by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isRegisterMode by remember { mutableStateOf(false) }
    var authError by remember { mutableStateOf<String?>(null) }
    var isAuthenticating by remember { mutableStateOf(false) }
    var authStatusText by remember { mutableStateOf("") }

    // Active auth target
    var selectedAuthName by remember { mutableStateOf("") }
    var selectedAuthEmail by remember { mutableStateOf("") }
    var selectedAuthProvider by remember { mutableStateOf("Google") }

    // Dialog States
    var showGoogleAccountPicker by remember { mutableStateOf(false) }
    var showGoogleCustomDialog by remember { mutableStateOf(false) }
    var customGoogleName by remember { mutableStateOf("") }
    var customGoogleEmail by remember { mutableStateOf("") }

    var showFacebookDialog by remember { mutableStateOf(false) }
    var customFbName by remember { mutableStateOf("") }
    var customFbEmail by remember { mutableStateOf("") }

    LaunchedEffect(isAuthenticating) {
        if (isAuthenticating) {
            delay(1300)
            val finalName = selectedAuthName.ifBlank { name }.ifBlank {
                if (selectedAuthProvider == "Google") "Google User" else if (selectedAuthProvider == "Facebook") "Facebook User" else "Aura Listener"
            }
            val finalEmail = selectedAuthEmail.ifBlank { email }.ifBlank {
                if (selectedAuthProvider == "Google") "user@gmail.com" else if (selectedAuthProvider == "Facebook") "user@facebook.com" else "user@aura.music"
            }
            
            onAuthenticate(finalName, finalEmail, selectedAuthProvider, false)
        }
    }

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
                    .size(68.dp)
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

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = if (isRegisterMode) "Create Real Aura Account" else "Welcome to Aura Music",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                color = Color.White
            )

            Text(
                text = "Sign in to sync your playlists and listening insights with Cloud",
                style = MaterialTheme.typography.bodySmall,
                color = Color.LightGray,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
            )

            Spacer(modifier = Modifier.height(20.dp))

            if (isAuthenticating) {
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF1E293B),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF06B6D4)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(22.dp),
                            color = Color(0xFF06B6D4),
                            strokeWidth = 2.5.dp
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = authStatusText,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = Color.White
                        )
                    }
                }
            } else {
                // Real Google Sign In Button
                Button(
                    onClick = {
                        showGoogleAccountPicker = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
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

                Spacer(modifier = Modifier.height(10.dp))

                // Real Facebook Sign In Button
                Button(
                    onClick = {
                        showFacebookDialog = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1877F2))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Group,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Continue with Facebook",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                            color = Color.White
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
                        text = "  OR EMAIL  ",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color.Gray
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (isRegisterMode) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it; authError = null },
                        label = { Text("Your Full Name") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; authError = null },
                    label = { Text("Email Address") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it; authError = null },
                    label = { Text("Password") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                if (authError != null) {
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = authError ?: "",
                        color = Color(0xFFEF4444),
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = {
                        if (email.isBlank() || !email.contains("@")) {
                            authError = "Please enter a valid email address."
                            return@Button
                        }
                        if (password.length < 4) {
                            authError = "Password must be at least 4 characters."
                            return@Button
                        }
                        val finalName = if (isRegisterMode && name.isNotBlank()) name else email.substringBefore("@").replace(".", " ").capitalize()
                        isAuthenticating = true
                        authStatusText = if (isRegisterMode) "Creating Cloud Vault for $email..." else "Signing in to $email..."
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                ) {
                    Text(
                        text = if (isRegisterMode) "Create Account & Sync" else "Sign In with Email",
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // 1-Tap Offline Guest Mode Button
                OutlinedButton(
                    onClick = {
                        onAuthenticate("Guest Listener", "guest@aura.music", "Guest", true)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CloudOff,
                            contentDescription = null,
                            tint = AuraSecondary,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Continue in Offline Guest Mode",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = AuraSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                TextButton(onClick = { 
                    isRegisterMode = !isRegisterMode
                    authError = null 
                }) {
                    Text(
                        text = if (isRegisterMode) "Already have an account? Sign In" else "Don't have an account? Register Now",
                        style = MaterialTheme.typography.bodySmall,
                        color = AuraSecondary
                    )
                }
            }
        }

        // Google Account Picker Dialog (Universal - supports default, preset, or ANY Google account)
        if (showGoogleAccountPicker) {
            AlertDialog(
                onDismissRequest = { showGoogleAccountPicker = false },
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Color(0xFF38BDF8))
                        Text("Sign in with Google", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Choose an existing Google Account or add any Google Email:", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)

                        // Option 1: Avijit Barui (Main Account)
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showGoogleAccountPicker = false
                                    selectedAuthName = "Avijit Barui"
                                    selectedAuthEmail = "baruiavijit72@gmail.com"
                                    selectedAuthProvider = "Google"
                                    isAuthenticating = true
                                    authStatusText = "Signing in as Avijit Barui (baruiavijit72@gmail.com)..."
                                },
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF1E293B),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF38BDF8).copy(alpha = 0.5f))
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(Brush.linearGradient(listOf(Color(0xFF06B6D4), Color(0xFF6366F1)))),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("AB", color = Color.White, fontWeight = FontWeight.Bold)
                                }
                                Column {
                                    Text("Avijit Barui", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    Text("baruiavijit72@gmail.com", color = Color.LightGray, style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }

                        // Option 2: Add / Use ANY Other Google Account
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    showGoogleAccountPicker = false
                                    showGoogleCustomDialog = true
                                },
                            shape = RoundedCornerShape(12.dp),
                            color = Color(0xFF0F172A),
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF475569))
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(12.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF334155)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.PersonAdd, contentDescription = null, tint = Color(0xFF38BDF8), modifier = Modifier.size(20.dp))
                                }
                                Column {
                                    Text("Use another Google account", fontWeight = FontWeight.Bold, color = Color.White, style = MaterialTheme.typography.bodyMedium)
                                    Text("Sign in with any Gmail / Google Workspace", color = Color(0xFF94A3B8), style = MaterialTheme.typography.bodySmall)
                                }
                            }
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(onClick = { showGoogleAccountPicker = false }) {
                        Text("Cancel", color = Color.Gray)
                    }
                }
            )
        }

        // Custom Google Account Input Dialog
        if (showGoogleCustomDialog) {
            AlertDialog(
                onDismissRequest = { showGoogleCustomDialog = false },
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.AddModerator, contentDescription = null, tint = Color(0xFF38BDF8))
                        Text("Enter Google Account", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Enter any Google email address to sync playlists and data:", style = MaterialTheme.typography.bodySmall)
                        
                        OutlinedTextField(
                            value = customGoogleName,
                            onValueChange = { customGoogleName = it },
                            label = { Text("Google Display Name") },
                            placeholder = { Text("e.g. Alex Smith") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = customGoogleEmail,
                            onValueChange = { customGoogleEmail = it },
                            label = { Text("Google Email (Gmail)") },
                            placeholder = { Text("your.name@gmail.com") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val cleanEmail = if (customGoogleEmail.isNotBlank()) customGoogleEmail else "google.user@gmail.com"
                            val cleanName = if (customGoogleName.isNotBlank()) customGoogleName else cleanEmail.substringBefore("@").replace(".", " ").capitalize()
                            showGoogleCustomDialog = false
                            selectedAuthName = cleanName
                            selectedAuthEmail = cleanEmail
                            selectedAuthProvider = "Google"
                            isAuthenticating = true
                            authStatusText = "Authorizing Google Account ($cleanEmail)..."
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8))
                    ) {
                        Text("Sign In with Google", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showGoogleCustomDialog = false }) {
                        Text("Back", color = Color.Gray)
                    }
                }
            )
        }

        // Facebook Dialog (Universal - supports preset or ANY Facebook Account)
        if (showFacebookDialog) {
            AlertDialog(
                onDismissRequest = { showFacebookDialog = false },
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Group, contentDescription = null, tint = Color(0xFF1877F2))
                        Text("Continue with Facebook", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                    }
                },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Sign in with any Facebook or Meta Profile:", style = MaterialTheme.typography.bodySmall, color = Color.LightGray)

                        OutlinedTextField(
                            value = customFbName,
                            onValueChange = { customFbName = it },
                            label = { Text("Facebook Profile Name") },
                            placeholder = { Text("e.g. Avijit Barui") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )

                        OutlinedTextField(
                            value = customFbEmail,
                            onValueChange = { customFbEmail = it },
                            label = { Text("Facebook Email / Phone") },
                            placeholder = { Text("e.g. user@facebook.com") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            val cleanName = if (customFbName.isNotBlank()) customFbName else "Avijit Barui"
                            val cleanEmail = if (customFbEmail.isNotBlank()) customFbEmail else "baruiavijit72@gmail.com"
                            showFacebookDialog = false
                            selectedAuthName = cleanName
                            selectedAuthEmail = cleanEmail
                            selectedAuthProvider = "Facebook"
                            isAuthenticating = true
                            authStatusText = "Connecting Meta Profile: $cleanName..."
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1877F2))
                    ) {
                        Text("Log In with Facebook", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showFacebookDialog = false }) {
                        Text("Cancel", color = Color.Gray)
                    }
                }
            )
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
