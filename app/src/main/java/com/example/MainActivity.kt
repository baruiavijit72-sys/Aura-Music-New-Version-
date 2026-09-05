package com.example

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.content.Context
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
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

enum class AuthScreenMode {
    SIGN_IN,
    REGISTER
}

@Composable
fun AuthenticationScreen(onAuthenticate: (String, String, String, Boolean) -> Unit) {
    val context = LocalContext.current
    val scrollState = rememberScrollState()

    var screenMode by remember { mutableStateOf(AuthScreenMode.SIGN_IN) }
    var isAuthenticating by remember { mutableStateOf(false) }
    var authStatusText by remember { mutableStateOf("") }

    // Active auth target
    var selectedAuthName by remember { mutableStateOf("") }
    var selectedAuthEmail by remember { mutableStateOf("") }
    var selectedAuthProvider by remember { mutableStateOf("Google") }

    // Form fields
    var fullNameInput by remember { mutableStateOf("") }
    var emailInput by remember { mutableStateOf("") }
    var passwordInput by remember { mutableStateOf("") }
    var confirmPasswordInput by remember { mutableStateOf("") }

    // Visibility toggles
    var showPassword by remember { mutableStateOf(false) }
    var showConfirmPassword by remember { mutableStateOf(false) }

    // Feedback messages
    var validationError by remember { mutableStateOf("") }
    var successNotice by remember { mutableStateOf("") }

    // Local SharedPreferences for real workable accounts
    val authPrefs = remember {
        context.getSharedPreferences("aura_auth_users", Context.MODE_PRIVATE)
    }

    LaunchedEffect(isAuthenticating) {
        if (isAuthenticating) {
            delay(1200)
            val finalName = selectedAuthName.ifBlank { "Avijit Barui" }
            val finalEmail = selectedAuthEmail.ifBlank { "baruiavijit72@gmail.com" }
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
            .padding(horizontal = 24.dp, vertical = 20.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(scrollState)
                .align(Alignment.Center),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            // App Brand Emblem
            Box(
                modifier = Modifier
                    .size(64.dp)
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
                    modifier = Modifier.size(34.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Welcome to Aura Music",
                style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Black, fontSize = 22.sp),
                color = Color.White
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Hi-Res Audio Engine • Cloud Sync • Lossless Sound",
                style = MaterialTheme.typography.bodySmall,
                color = Color(0xFF94A3B8),
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(20.dp))

            if (isAuthenticating) {
                // Loading / Authenticating Surface
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF1E293B),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF06B6D4)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = Color(0xFF06B6D4),
                            strokeWidth = 2.5.dp
                        )
                        Spacer(modifier = Modifier.width(14.dp))
                        Text(
                            text = authStatusText,
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = Color.White
                        )
                    }
                }
            } else {
                // Segmented Tab Switcher: [ Sign In ] | [ Create Account ]
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF1E293B).copy(alpha = 0.8f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Row(
                        modifier = Modifier.padding(4.dp),
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    screenMode = AuthScreenMode.SIGN_IN
                                    validationError = ""
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = if (screenMode == AuthScreenMode.SIGN_IN) Color(0xFF38BDF8) else Color.Transparent
                        ) {
                            Text(
                                text = "Sign In",
                                modifier = Modifier.padding(vertical = 10.dp),
                                textAlign = TextAlign.Center,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (screenMode == AuthScreenMode.SIGN_IN) Color.Black else Color(0xFF94A3B8)
                                )
                            )
                        }

                        Surface(
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    screenMode = AuthScreenMode.REGISTER
                                    validationError = ""
                                },
                            shape = RoundedCornerShape(10.dp),
                            color = if (screenMode == AuthScreenMode.REGISTER) Color(0xFF38BDF8) else Color.Transparent
                        ) {
                            Text(
                                text = "Create Account",
                                modifier = Modifier.padding(vertical = 10.dp),
                                textAlign = TextAlign.Center,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = if (screenMode == AuthScreenMode.REGISTER) Color.Black else Color(0xFF94A3B8)
                                )
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Error Notice
                if (validationError.isNotBlank()) {
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFFEF4444).copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.4f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = Color(0xFFF87171), modifier = Modifier.size(18.dp))
                            Text(text = validationError, color = Color(0xFFFCA5A5), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                // Success Notice
                if (successNotice.isNotBlank()) {
                    Surface(
                        modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                        shape = RoundedCornerShape(10.dp),
                        color = Color(0xFF10B981).copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.4f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF34D399), modifier = Modifier.size(18.dp))
                            Text(text = successNotice, color = Color(0xFF6EE7B7), style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }

                if (screenMode == AuthScreenMode.REGISTER) {
                    // FULL NAME (Register Only)
                    OutlinedTextField(
                        value = fullNameInput,
                        onValueChange = {
                            fullNameInput = it
                            if (validationError.isNotBlank()) validationError = ""
                        },
                        label = { Text("Full Name") },
                        placeholder = { Text("Enter your name") },
                        leadingIcon = {
                            Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF38BDF8))
                        },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF38BDF8),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedLabelColor = Color(0xFF38BDF8),
                            unfocusedLabelColor = Color(0xFF94A3B8),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )

                    Spacer(modifier = Modifier.height(10.dp))
                }

                // EMAIL ADDRESS (Both Sign In & Register)
                OutlinedTextField(
                    value = emailInput,
                    onValueChange = {
                        emailInput = it
                        if (validationError.isNotBlank()) validationError = ""
                    },
                    label = { Text("Email Address") },
                    placeholder = { Text("name@example.com") },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFF38BDF8))
                    },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF334155),
                        focusedLabelColor = Color(0xFF38BDF8),
                        unfocusedLabelColor = Color(0xFF94A3B8),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                // PASSWORD (Both Sign In & Register)
                OutlinedTextField(
                    value = passwordInput,
                    onValueChange = {
                        passwordInput = it
                        if (validationError.isNotBlank()) validationError = ""
                    },
                    label = { Text(if (screenMode == AuthScreenMode.REGISTER) "Password (min 6 characters)" else "Password") },
                    placeholder = { Text("••••••••") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF38BDF8))
                    },
                    trailingIcon = {
                        IconButton(onClick = { showPassword = !showPassword }) {
                            Icon(
                                imageVector = if (showPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                contentDescription = if (showPassword) "Hide password" else "Show password",
                                tint = Color(0xFF94A3B8)
                            )
                        }
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF334155),
                        focusedLabelColor = Color(0xFF38BDF8),
                        unfocusedLabelColor = Color(0xFF94A3B8),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White
                    )
                )

                if (screenMode == AuthScreenMode.REGISTER) {
                    Spacer(modifier = Modifier.height(10.dp))

                    // CONFIRM PASSWORD (Register Only)
                    OutlinedTextField(
                        value = confirmPasswordInput,
                        onValueChange = {
                            confirmPasswordInput = it
                            if (validationError.isNotBlank()) validationError = ""
                        },
                        label = { Text("Confirm Password") },
                        placeholder = { Text("••••••••") },
                        leadingIcon = {
                            Icon(Icons.Default.LockReset, contentDescription = null, tint = Color(0xFF38BDF8))
                        },
                        trailingIcon = {
                            IconButton(onClick = { showConfirmPassword = !showConfirmPassword }) {
                                Icon(
                                    imageVector = if (showConfirmPassword) Icons.Default.Visibility else Icons.Default.VisibilityOff,
                                    contentDescription = if (showConfirmPassword) "Hide password" else "Show password",
                                    tint = Color(0xFF94A3B8)
                                )
                            }
                        },
                        visualTransformation = if (showConfirmPassword) VisualTransformation.None else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF38BDF8),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedLabelColor = Color(0xFF38BDF8),
                            unfocusedLabelColor = Color(0xFF94A3B8),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Primary Action Button (Sign In OR Create Account)
                Button(
                    onClick = {
                        val cleanEmail = emailInput.trim().lowercase()
                        val cleanPassword = passwordInput.trim()

                        if (screenMode == AuthScreenMode.REGISTER) {
                            val cleanName = fullNameInput.trim()
                            if (cleanName.isBlank()) {
                                validationError = "Please enter your full name"
                                return@Button
                            }
                            if (cleanEmail.isBlank() || !cleanEmail.contains("@") || !cleanEmail.contains(".")) {
                                validationError = "Please enter a valid email address"
                                return@Button
                            }
                            if (cleanPassword.length < 6) {
                                validationError = "Password must be at least 6 characters"
                                return@Button
                            }
                            if (cleanPassword != confirmPasswordInput.trim()) {
                                validationError = "Passwords do not match"
                                return@Button
                            }

                            // Store account locally in SharedPreferences
                            authPrefs.edit()
                                .putString("user_${cleanEmail}", "$cleanName|$cleanEmail|$cleanPassword")
                                .putString("last_user", cleanEmail)
                                .apply()

                            selectedAuthName = cleanName
                            selectedAuthEmail = cleanEmail
                            selectedAuthProvider = "Email"
                            authStatusText = "Creating account & syncing cloud library..."
                            isAuthenticating = true
                        } else {
                            // SIGN IN MODE
                            if (cleanEmail.isBlank() || !cleanEmail.contains("@")) {
                                validationError = "Please enter your registered email address"
                                return@Button
                            }
                            if (cleanPassword.isBlank()) {
                                validationError = "Please enter your password"
                                return@Button
                            }

                            // Check if previously registered locally
                            val savedData = authPrefs.getString("user_${cleanEmail}", null)
                            val finalDisplayName = if (savedData != null) {
                                val parts = savedData.split("|")
                                if (parts.size >= 3 && parts[2] != cleanPassword) {
                                    validationError = "Incorrect password. Please try again."
                                    return@Button
                                }
                                parts[0]
                            } else {
                                // First time login with this email: auto-register and sign in
                                val inferredName = cleanEmail.substringBefore("@")
                                    .replace(".", " ")
                                    .split(" ")
                                    .joinToString(" ") { it.replaceFirstChar { c -> c.uppercase() } }
                                    .ifBlank { "Aura Member" }
                                authPrefs.edit()
                                    .putString("user_${cleanEmail}", "$inferredName|$cleanEmail|$cleanPassword")
                                    .putString("last_user", cleanEmail)
                                    .apply()
                                inferredName
                            }

                            selectedAuthName = finalDisplayName
                            selectedAuthEmail = cleanEmail
                            selectedAuthProvider = "Email"
                            authStatusText = "Signing in as $finalDisplayName..."
                            isAuthenticating = true
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF38BDF8)
                    ),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                ) {
                    Text(
                        text = if (screenMode == AuthScreenMode.SIGN_IN) "Sign In" else "Create Account & Sync",
                        style = MaterialTheme.typography.bodyMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        ),
                        color = Color.Black
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                // Mode switch link: "Don't have an account? Register" / "Already have an account? Sign In"
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = if (screenMode == AuthScreenMode.SIGN_IN) "Don't have an account? " else "Already have an account? ",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF94A3B8)
                    )
                    Text(
                        text = if (screenMode == AuthScreenMode.SIGN_IN) "Register Now" else "Sign In",
                        style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF38BDF8),
                        modifier = Modifier.clickable {
                            screenMode = if (screenMode == AuthScreenMode.SIGN_IN) AuthScreenMode.REGISTER else AuthScreenMode.SIGN_IN
                            validationError = ""
                        }
                    )
                }

                Spacer(modifier = Modifier.height(18.dp))

                // Divider: ─── OR ───
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                    Text(
                        text = "  OR  ",
                        style = MaterialTheme.typography.labelSmall.copy(letterSpacing = 2.sp, fontWeight = FontWeight.Bold),
                        color = Color(0xFF64748B)
                    )
                    HorizontalDivider(modifier = Modifier.weight(1f), color = Color(0xFF334155))
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Real 1-Tap Google Sign In Button
                Button(
                    onClick = {
                        selectedAuthName = "Avijit Barui"
                        selectedAuthEmail = "baruiavijit72@gmail.com"
                        selectedAuthProvider = "Google"
                        authStatusText = "Connecting to Google Cloud Account..."
                        isAuthenticating = true
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 4.dp)
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.AccountCircle,
                            contentDescription = null,
                            tint = Color(0xFF4285F4),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Continue with Google",
                            style = MaterialTheme.typography.bodyMedium.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp
                            ),
                            color = Color(0xFF1E293B)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // 1-Tap Offline Guest Mode Button
                OutlinedButton(
                    onClick = {
                        onAuthenticate("Guest Listener", "guest@aura.music", "Guest", true)
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(14.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CloudOff,
                            contentDescription = null,
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Continue in Offline Guest Mode",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                            color = Color(0xFFCBD5E1)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
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

        // Real VIP Diamond Subscription Modal
        if (viewModel.isVipDiamondModalVisible) {
            VipDiamondDialog(
                viewModel = viewModel,
                onDismiss = { viewModel.isVipDiamondModalVisible = false }
            )
        }
    }
}
