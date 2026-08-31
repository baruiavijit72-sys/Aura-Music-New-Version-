package com.example.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QueueSheet(
    viewModel: AuraViewModel,
    onDismiss: () -> Unit
) {
    var isSaveAsPlaylistOpen by remember { mutableStateOf(false) }
    var newPlaylistName by remember { mutableStateOf("Queue Mix ${System.currentTimeMillis() % 1000}") }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 24.dp)
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Active Play Queue",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "${viewModel.playQueue.size} tracks queued",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilledTonalButton(
                        onClick = { isSaveAsPlaylistOpen = true },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Save,
                            contentDescription = null,
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Playlist", style = MaterialTheme.typography.labelSmall)
                    }

                    OutlinedButton(
                        onClick = { viewModel.clearQueue() },
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Clear", style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))

            // Queue List
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp)
            ) {
                itemsIndexed(viewModel.playQueue) { index, track ->
                    val isCurrent = index == viewModel.currentTrackIndex

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 3.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .clickable {
                                viewModel.playTrack(track)
                            },
                        color = if (isCurrent) AuraPrimary.copy(alpha = 0.15f)
                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "${index + 1}",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = if (isCurrent) AuraPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.width(28.dp)
                            )

                            // Thumbnail
                            Box(
                                modifier = Modifier
                                    .size(38.dp)
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(
                                        Brush.linearGradient(
                                            track.coverGradient.map { Color(it) }
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                if (isCurrent && viewModel.isPlaying) {
                                    Icon(
                                        imageVector = Icons.Default.Equalizer,
                                        contentDescription = null,
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = track.title,
                                    style = MaterialTheme.typography.bodyMedium.copy(
                                        fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal
                                    ),
                                    color = if (isCurrent) AuraPrimary else MaterialTheme.colorScheme.onSurface,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Text(
                                    text = "${track.artist} • ${track.durationFormatted}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }

                            // Reorder Up / Down & Remove
                            IconButton(
                                onClick = {
                                    if (index > 0) viewModel.reorderQueue(index, index - 1)
                                },
                                enabled = index > 0,
                                modifier = Modifier.size(30.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowUpward,
                                    contentDescription = "Move Up",
                                    tint = if (index > 0) MaterialTheme.colorScheme.onSurface else Color.Gray,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            IconButton(
                                onClick = {
                                    if (index < viewModel.playQueue.size - 1) viewModel.reorderQueue(index, index + 1)
                                },
                                enabled = index < viewModel.playQueue.size - 1,
                                modifier = Modifier.size(30.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.ArrowDownward,
                                    contentDescription = "Move Down",
                                    tint = if (index < viewModel.playQueue.size - 1) MaterialTheme.colorScheme.onSurface else Color.Gray,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            IconButton(
                                onClick = { viewModel.removeQueueItem(index) },
                                modifier = Modifier.size(30.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = "Remove",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    if (isSaveAsPlaylistOpen) {
        AlertDialog(
            onDismissRequest = { isSaveAsPlaylistOpen = false },
            title = { Text("Save Queue as Playlist") },
            text = {
                OutlinedTextField(
                    value = newPlaylistName,
                    onValueChange = { newPlaylistName = it },
                    label = { Text("Playlist Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        val pl = com.example.model.Playlist(
                            name = newPlaylistName,
                            trackIds = viewModel.playQueue.map { it.id }
                        )
                        viewModel.createPlaylist(pl.name, "Saved from play queue")
                        isSaveAsPlaylistOpen = false
                        onDismiss()
                    }
                ) {
                    Text("Save")
                }
            },
            dismissButton = {
                TextButton(onClick = { isSaveAsPlaylistOpen = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}
