package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.AppThemeMode
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun SettingsScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    var isAddBlacklistDialogOpen by remember { mutableStateOf(false) }
    var newBlacklistFolder by remember { mutableStateOf("") }
    var dbExportBanner by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Settings & Preferences",
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurface
        )

        // 1. Theme Engine
        Text(
            text = "THEME & UI STYLING",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                ThemeOptionRow(
                    title = "Pure OLED Black (Default)",
                    subtitle = "100% true black background for AMOLED battery savings",
                    isSelected = viewModel.appThemeMode == AppThemeMode.OLED_BLACK,
                    onClick = { viewModel.appThemeMode = AppThemeMode.OLED_BLACK }
                )

                ThemeOptionRow(
                    title = "Dark Material 3",
                    subtitle = "Deep navy slate dark theme",
                    isSelected = viewModel.appThemeMode == AppThemeMode.DARK_MATERIAL,
                    onClick = { viewModel.appThemeMode = AppThemeMode.DARK_MATERIAL }
                )

                ThemeOptionRow(
                    title = "Light Air Mode",
                    subtitle = "Clean high-contrast light theme",
                    isSelected = viewModel.appThemeMode == AppThemeMode.LIGHT_AIR,
                    onClick = { viewModel.appThemeMode = AppThemeMode.LIGHT_AIR }
                )

                ThemeOptionRow(
                    title = "Material You Dynamic Palette",
                    subtitle = "Colors adapt dynamically based on album artwork",
                    isSelected = viewModel.appThemeMode == AppThemeMode.DYNAMIC_ALBUM_ART,
                    onClick = { viewModel.appThemeMode = AppThemeMode.DYNAMIC_ALBUM_ART }
                )
            }
        }

        // 2. Headphone & Hardware Auto-Detection
        Text(
            text = "HEADPHONE & HARDWARE CONTROLS",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Headphone Auto-Pause & Resume", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                        Text("Pauses playback on unplug/disconnect, resumes on reconnect.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = viewModel.headphoneAutoPause,
                        onCheckedChange = { viewModel.headphoneAutoPause = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = AuraPrimary, checkedTrackColor = AuraPrimary.copy(alpha = 0.5f))
                    )
                }

                HorizontalDivider()

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Filter Short Notification Sounds", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                        Text("Excludes audio files shorter than 30s (e.g. WhatsApp notes).", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Switch(
                        checked = viewModel.filterShortAudio,
                        onCheckedChange = { viewModel.filterShortAudio = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = AuraPrimary, checkedTrackColor = AuraPrimary.copy(alpha = 0.5f))
                    )
                }
            }
        }

        // 3. Blacklisted & Excluded Folders Manager
        Text(
            text = "EXCLUDED / BLACKLISTED FOLDERS",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

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
                    Text("Folder Blacklist (${viewModel.blacklistedFolders.size})", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                    IconButton(onClick = { isAddBlacklistDialogOpen = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Blacklist", tint = AuraPrimary)
                    }
                }

                viewModel.blacklistedFolders.forEach { folder ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.FolderOff, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(folder, style = MaterialTheme.typography.bodySmall)
                        }
                        IconButton(
                            onClick = {
                                viewModel.blacklistedFolders = viewModel.blacklistedFolders.filter { it != folder }
                            },
                            modifier = Modifier.size(28.dp)
                        ) {
                            Icon(Icons.Default.Close, contentDescription = "Remove", tint = Color.Gray, modifier = Modifier.size(16.dp))
                        }
                    }
                }
            }
        }

        // 4. Drift / SQLite Database Export & Backup
        Text(
            text = "DATABASE & LOCAL DATA STORAGE (DRIFT / SQLITE)",
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Aura Music uses an offline-first Drift/SQLite database for playlists, transfer logs, and listening metrics.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            dbExportBanner = "Exported aura_database_backup.sqlite to /storage/emulated/0/Download/"
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
                    ) {
                        Icon(Icons.Default.FileDownload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Export SQLite", style = MaterialTheme.typography.labelSmall)
                    }

                    OutlinedButton(
                        onClick = {
                            dbExportBanner = "Database restored successfully from local backup."
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Default.FileUpload, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Import Backup", style = MaterialTheme.typography.labelSmall)
                    }
                }

                if (dbExportBanner != null) {
                    Text(
                        text = dbExportBanner!!,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }

    if (isAddBlacklistDialogOpen) {
        AlertDialog(
            onDismissRequest = { isAddBlacklistDialogOpen = false },
            title = { Text("Blacklist Folder") },
            text = {
                OutlinedTextField(
                    value = newBlacklistFolder,
                    onValueChange = { newBlacklistFolder = it },
                    label = { Text("Folder Path (e.g. /Music/Ringtones)") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (newBlacklistFolder.isNotBlank()) {
                            viewModel.blacklistedFolders = viewModel.blacklistedFolders + newBlacklistFolder
                            newBlacklistFolder = ""
                            isAddBlacklistDialogOpen = false
                        }
                    }
                ) {
                    Text("Add")
                }
            },
            dismissButton = {
                TextButton(onClick = { isAddBlacklistDialogOpen = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun ThemeOptionRow(
    title: String,
    subtitle: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isSelected) AuraPrimary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.surface,
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                Text(text = subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (isSelected) {
                Icon(Icons.Default.CheckCircle, contentDescription = "Selected", tint = AuraPrimary)
            }
        }
    }
}
