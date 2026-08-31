package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.state.AppScreen
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopNavBar(
    viewModel: AuraViewModel,
    title: String,
    showBackButton: Boolean = false,
    onBackClick: () -> Unit = { viewModel.goBack() }
) {
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (title == "Aura Music") {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(
                                Brush.linearGradient(
                                    listOf(AuraPrimary, AuraSecondary)
                                )
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.GraphicEq,
                            contentDescription = "Aura Icon",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        ),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (title == "Aura Music") {
                        Text(
                            text = "Lossless P2P Music Engine",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        },
        navigationIcon = {
            if (showBackButton) {
                IconButton(onClick = onBackClick) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        },
        actions = {
            // Equalizer Shortcut
            IconButton(onClick = { viewModel.navigateTo(AppScreen.EQUALIZER) }) {
                Icon(
                    imageVector = Icons.Default.Tune,
                    contentDescription = "Equalizer",
                    tint = if (viewModel.currentScreen == AppScreen.EQUALIZER) AuraPrimary else MaterialTheme.colorScheme.onSurface
                )
            }

            // P2P Quick Share Shortcut
            IconButton(onClick = { viewModel.navigateTo(AppScreen.P2P_SHARE) }) {
                Icon(
                    imageVector = Icons.Default.NearMe,
                    contentDescription = "P2P Share",
                    tint = if (viewModel.currentScreen == AppScreen.P2P_SHARE) AuraSecondary else MaterialTheme.colorScheme.onSurface
                )
            }

            // Cloud / Profile Avatar Shortcut
            Box(
                modifier = Modifier
                    .padding(end = 12.dp)
                    .size(34.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
                    .clickable { viewModel.navigateTo(AppScreen.PROFILE_CLOUD) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = viewModel.userProfile.avatarInitials,
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                    color = AuraPrimary
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    )
}

@Composable
fun BottomNavBar(
    currentScreen: AppScreen,
    onNavigate: (AppScreen) -> Unit
) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 8.dp
    ) {
        NavigationBarItem(
            selected = currentScreen == AppScreen.HOME,
            onClick = { onNavigate(AppScreen.HOME) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.HOME) Icons.Filled.Home else Icons.Outlined.Home,
                    contentDescription = "Home"
                )
            },
            label = { Text("Home", style = MaterialTheme.typography.labelSmall) }
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.LIBRARY,
            onClick = { onNavigate(AppScreen.LIBRARY) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.LIBRARY) Icons.Filled.LibraryMusic else Icons.Outlined.LibraryMusic,
                    contentDescription = "Library"
                )
            },
            label = { Text("Library", style = MaterialTheme.typography.labelSmall) }
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.P2P_SHARE,
            onClick = { onNavigate(AppScreen.P2P_SHARE) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.P2P_SHARE) Icons.Filled.WifiTethering else Icons.Outlined.WifiTethering,
                    contentDescription = "P2P Share"
                )
            },
            label = { Text("P2P Share", style = MaterialTheme.typography.labelSmall) }
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.PLAYLISTS,
            onClick = { onNavigate(AppScreen.PLAYLISTS) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.PLAYLISTS) Icons.Filled.QueueMusic else Icons.Outlined.QueueMusic,
                    contentDescription = "Playlists"
                )
            },
            label = { Text("Playlists", style = MaterialTheme.typography.labelSmall) }
        )

        NavigationBarItem(
            selected = currentScreen == AppScreen.ANALYTICS,
            onClick = { onNavigate(AppScreen.ANALYTICS) },
            icon = {
                Icon(
                    imageVector = if (currentScreen == AppScreen.ANALYTICS) Icons.Filled.Insights else Icons.Outlined.Insights,
                    contentDescription = "Insights"
                )
            },
            label = { Text("Insights", style = MaterialTheme.typography.labelSmall) }
        )
    }
}
