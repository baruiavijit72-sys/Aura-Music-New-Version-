package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun ProfileCloudScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val user = viewModel.userProfile
    val sdf = remember { SimpleDateFormat("MMM dd, yyyy • HH:mm", Locale.getDefault()) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // User Profile Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            tonalElevation = 4.dp
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(listOf(AuraPrimary, AuraSecondary))
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = user.avatarInitials,
                        style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = if (user.isGuest) "Guest Offline User" else user.displayName,
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = if (user.isGuest) "Local Device Mode (No Cloud Account)" else user.email,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(6.dp))

                Surface(
                    shape = RoundedCornerShape(6.dp),
                    color = AuraPrimary.copy(alpha = 0.2f)
                ) {
                    Text(
                        text = "AUTH: ${user.authProvider.uppercase()}",
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = AuraPrimary,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
        }

        // Cloud Data Backup & Multi-Device Sync Card
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CloudSync, contentDescription = null, tint = AuraSecondary)
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Cloud Playlist & Data Sync",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                    }

                    if (viewModel.isCloudSyncing) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = AuraSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Last Synced: ${sdf.format(Date(user.lastCloudSyncTime))}\n${user.totalPlaylistsSynced} Playlists • ${user.totalCloudBackupSizeMb} MB metadata synchronized.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(14.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = { viewModel.performCloudBackup() },
                        enabled = !viewModel.isCloudSyncing,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                    ) {
                        Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Backup Now")
                    }

                    OutlinedButton(
                        onClick = { viewModel.performCloudBackup() },
                        enabled = !viewModel.isCloudSyncing,
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.CloudDownload, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Restore")
                    }
                }
            }
        }

        // Account Switcher Providers
        Text(
            text = "AUTHENTICATION & SIGN-IN OPTIONS",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                AccountOptionRow(
                    icon = Icons.Default.AccountCircle,
                    title = "Google Sign-In",
                    subtitle = "baruiavijit72@gmail.com",
                    isActive = user.authProvider == "Google",
                    onClick = { viewModel.switchAccount("Google") }
                )

                AccountOptionRow(
                    icon = Icons.Default.Share,
                    title = "Facebook Sign-In",
                    subtitle = "Sync social playlists & listening with friends",
                    isActive = user.authProvider == "Facebook",
                    onClick = { viewModel.switchAccount("Facebook") }
                )

                AccountOptionRow(
                    icon = Icons.Default.AirplanemodeActive,
                    title = "Guest / Offline Mode",
                    subtitle = "100% offline storage, zero cloud telemetry",
                    isActive = user.authProvider == "Guest",
                    onClick = { viewModel.switchAccount("Guest") }
                )
            }
        }

        // Banner confirmation
        if (viewModel.cloudSyncBannerMessage != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF10B981).copy(alpha = 0.2f)
            ) {
                Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = viewModel.cloudSyncBannerMessage!!,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }
}

@Composable
fun AccountOptionRow(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    subtitle: String,
    isActive: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = if (isActive) AuraPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(imageVector = icon, contentDescription = null, tint = if (isActive) AuraPrimary else MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                    Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            if (isActive) {
                Icon(Icons.Default.Check, contentDescription = "Active", tint = AuraPrimary)
            } else {
                TextButton(onClick = onClick) {
                    Text("Switch", style = MaterialTheme.typography.labelSmall)
                }
            }
        }
    }
}
