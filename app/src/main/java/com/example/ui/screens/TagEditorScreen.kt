package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Save
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TagEditorScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val track = viewModel.editingTrack ?: viewModel.currentTrack ?: return

    var title by remember(track) { mutableStateOf(track.title) }
    var artist by remember(track) { mutableStateOf(track.artist) }
    var album by remember(track) { mutableStateOf(track.album) }
    var year by remember(track) { mutableStateOf(track.year.toString()) }
    var genre by remember(track) { mutableStateOf(track.genre) }
    var trackNumber by remember(track) { mutableStateOf(track.trackNumber.toString()) }
    var lyricsText by remember(track) { mutableStateOf(track.lyricsLrc) }
    var selectedCoverGradient by remember(track) { mutableStateOf(track.coverGradient) }
    var isCoverPickerOpen by remember { mutableStateOf(false) }
    var savedSuccessBanner by remember { mutableStateOf<String?>(null) }

    val presetPalettes = listOf(
        listOf(0xFF6366F1, 0xFFA855F7), // Indigo / Violet
        listOf(0xFFEC4899, 0xFFF43F5E), // Pink / Rose
        listOf(0xFF10B981, 0xFF06B6D4), // Emerald / Cyan
        listOf(0xFFF59E0B, 0xFFEF4444), // Amber / Red
        listOf(0xFF3B82F6, 0xFF1D4ED8), // Blue Ocean
        listOf(0xFF8B5CF6, 0xFFD946EF), // Purple Neon
        listOf(0xFF14B8A6, 0xFF0D9488), // Teal Deep
        listOf(0xFF64748B, 0xFF334155)  // Slate Steel
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 120.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Album Art Preview & Change Cover
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(72.dp)
                        .background(
                            Brush.linearGradient(
                                selectedCoverGradient.map { Color(it) }
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Image, contentDescription = null, tint = Color.White)
                }

                Spacer(modifier = Modifier.width(16.dp))

                Column {
                    Text(
                        text = "Lossless File Tag Metadata",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${track.format.extension} • ${track.fileSizeMb} MB • ID3v2 / FLAC Vorbis",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    TextButton(
                        onClick = { isCoverPickerOpen = true },
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Text("Change Cover Artwork Palette", color = AuraPrimary, style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }

        // Form Fields
        OutlinedTextField(
            value = title,
            onValueChange = { title = it },
            label = { Text("Track Title") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
        )

        OutlinedTextField(
            value = artist,
            onValueChange = { artist = it },
            label = { Text("Artist Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
        )

        OutlinedTextField(
            value = album,
            onValueChange = { album = it },
            label = { Text("Album Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            OutlinedTextField(
                value = year,
                onValueChange = { year = it },
                label = { Text("Year") },
                singleLine = true,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp)
            )

            OutlinedTextField(
                value = trackNumber,
                onValueChange = { trackNumber = it },
                label = { Text("Track #") },
                singleLine = true,
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(10.dp)
            )
        }

        OutlinedTextField(
            value = genre,
            onValueChange = { genre = it },
            label = { Text("Genre") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(10.dp)
        )

        // Synced LRC Editor Field
        OutlinedTextField(
            value = lyricsText,
            onValueChange = { lyricsText = it },
            label = { Text("Embedded LRC Synchronized Lyrics") },
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp),
            shape = RoundedCornerShape(10.dp)
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Save Button
        Button(
            onClick = {
                val updated = track.copy(
                    title = title,
                    artist = artist,
                    album = album,
                    year = year.toIntOrNull() ?: track.year,
                    trackNumber = trackNumber.toIntOrNull() ?: track.trackNumber,
                    genre = genre,
                    lyricsLrc = lyricsText,
                    coverGradient = selectedCoverGradient
                )
                viewModel.saveTrackTags(updated)
                savedSuccessBanner = "Updated metadata & ID3 tags for \"${title}\" successfully saved to storage."
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AuraPrimary)
        ) {
            Icon(Icons.Default.Save, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Save ID3 Tags to Storage")
        }

        if (savedSuccessBanner != null) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF10B981).copy(alpha = 0.2f)
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF10B981))
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = savedSuccessBanner!!,
                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                        color = Color(0xFF10B981)
                    )
                }
            }
        }
    }

    if (isCoverPickerOpen) {
        AlertDialog(
            onDismissRequest = { isCoverPickerOpen = false },
            title = { Text("Choose Artwork Palette") },
            text = {
                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Select a gradient aesthetic for this track's album art:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        presetPalettes.take(4).forEach { pal ->
                            Surface(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Brush.linearGradient(pal.map { Color(it) }))
                                    .clickable {
                                        selectedCoverGradient = pal
                                        isCoverPickerOpen = false
                                    },
                                color = Color.Transparent
                            ) {
                                if (selectedCoverGradient == pal) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                                    }
                                }
                            }
                        }
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        presetPalettes.drop(4).forEach { pal ->
                            Surface(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Brush.linearGradient(pal.map { Color(it) }))
                                    .clickable {
                                        selectedCoverGradient = pal
                                        isCoverPickerOpen = false
                                    },
                                color = Color.Transparent
                            ) {
                                if (selectedCoverGradient == pal) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Icon(Icons.Default.Check, contentDescription = null, tint = Color.White)
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { isCoverPickerOpen = false }) {
                    Text("Done")
                }
            }
        )
    }
}
