package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.TrackSource
import com.example.state.AuraViewModel
import com.example.ui.components.TrackItem
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@Composable
fun LibraryScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val categoryTabs = listOf("Tracks", "Albums", "Artists", "Genres", "Folders")
    var isSortMenuExpanded by remember { mutableStateOf(false) }

    // Filter tracks based on source, search query, and duration filter
    val filteredTracks = remember(
        viewModel.allTracks,
        viewModel.searchQuery,
        viewModel.selectedSourceFilter,
        viewModel.filterShortAudio,
        viewModel.sortBy
    ) {
        var list = viewModel.allTracks.filter { track ->
            val matchesQuery = viewModel.searchQuery.isEmpty() ||
                    track.title.contains(viewModel.searchQuery, ignoreCase = true) ||
                    track.artist.contains(viewModel.searchQuery, ignoreCase = true) ||
                    track.album.contains(viewModel.searchQuery, ignoreCase = true) ||
                    track.genre.contains(viewModel.searchQuery, ignoreCase = true)

            val matchesSource = viewModel.selectedSourceFilter == null || track.source == viewModel.selectedSourceFilter

            val matchesDuration = !viewModel.filterShortAudio || track.durationSeconds >= 30

            matchesQuery && matchesSource && matchesDuration
        }

        when (viewModel.sortBy) {
            "title" -> list.sortedBy { it.title }
            "artist" -> list.sortedBy { it.artist }
            "duration" -> list.sortedByDescending { it.durationSeconds }
            "size" -> list.sortedByDescending { it.fileSizeMb }
            "playCount" -> list.sortedByDescending { it.playCount }
            else -> list
        }
    }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // Search Input Field
        item {
            OutlinedTextField(
                value = viewModel.searchQuery,
                onValueChange = { viewModel.searchQuery = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                placeholder = { Text("Search title, artist, album, genre...") },
                leadingIcon = {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = AuraPrimary
                    )
                },
                trailingIcon = {
                    if (viewModel.searchQuery.isNotEmpty()) {
                        IconButton(onClick = { viewModel.searchQuery = "" }) {
                            Icon(Icons.Default.Clear, contentDescription = "Clear")
                        }
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(14.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AuraPrimary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
        }

        // Source Filter Chips (All, Local Device, P2P Received, External SD Card)
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                FilterChip(
                    selected = viewModel.selectedSourceFilter == null,
                    onClick = { viewModel.selectedSourceFilter = null },
                    label = { Text("All Sources (${viewModel.allTracks.size})") }
                )

                FilterChip(
                    selected = viewModel.selectedSourceFilter == TrackSource.LOCAL,
                    onClick = { viewModel.selectedSourceFilter = TrackSource.LOCAL },
                    label = { Text("Local Storage") },
                    leadingIcon = {
                        Icon(Icons.Default.PhoneAndroid, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                )

                FilterChip(
                    selected = viewModel.selectedSourceFilter == TrackSource.P2P_RECEIVED,
                    onClick = { viewModel.selectedSourceFilter = TrackSource.P2P_RECEIVED },
                    label = { Text("P2P Received") },
                    leadingIcon = {
                        Icon(Icons.Default.WifiTethering, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                )

                FilterChip(
                    selected = viewModel.selectedSourceFilter == TrackSource.IMPORTED,
                    onClick = { viewModel.selectedSourceFilter = TrackSource.IMPORTED },
                    label = { Text("SD Card") },
                    leadingIcon = {
                        Icon(Icons.Default.SdCard, contentDescription = null, modifier = Modifier.size(16.dp))
                    }
                )
            }
        }

        // Category Tab Row (Tracks, Albums, Artists, Genres, Folders)
        item {
            TabRow(
                selectedTabIndex = viewModel.selectedCategoryTab,
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = AuraPrimary,
                modifier = Modifier.padding(vertical = 4.dp)
            ) {
                categoryTabs.forEachIndexed { index, title ->
                    Tab(
                        selected = viewModel.selectedCategoryTab == index,
                        onClick = { viewModel.selectedCategoryTab = index },
                        text = {
                            Text(
                                text = title,
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = if (viewModel.selectedCategoryTab == index) FontWeight.Bold else FontWeight.Medium
                                )
                            )
                        }
                    )
                }
            }
        }

        // Control & Sorting Bar
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "${filteredTracks.size} Tracks",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (viewModel.filterShortAudio) AuraSecondary.copy(alpha = 0.15f) else Color.Transparent,
                        modifier = Modifier.clickable {
                            viewModel.filterShortAudio = !viewModel.filterShortAudio
                        }
                    ) {
                        Text(
                            text = if (viewModel.filterShortAudio) "> 30s Filter ON" else "All Audio",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontSize = 10.sp,
                                fontWeight = FontWeight.SemiBold
                            ),
                            color = AuraSecondary,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                // Sort Dropdown
                Box {
                    TextButton(onClick = { isSortMenuExpanded = true }) {
                        Icon(
                            imageVector = Icons.Default.Sort,
                            contentDescription = "Sort",
                            modifier = Modifier.size(18.dp),
                            tint = AuraPrimary
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Sort: ${viewModel.sortBy.replaceFirstChar { it.uppercase() }}",
                            style = MaterialTheme.typography.labelMedium,
                            color = AuraPrimary
                        )
                    }

                    DropdownMenu(
                        expanded = isSortMenuExpanded,
                        onDismissRequest = { isSortMenuExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Title (A-Z)") },
                            onClick = {
                                viewModel.sortBy = "title"
                                isSortMenuExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Artist Name") },
                            onClick = {
                                viewModel.sortBy = "artist"
                                isSortMenuExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Duration (Longest)") },
                            onClick = {
                                viewModel.sortBy = "duration"
                                isSortMenuExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("File Size (Lossless)") },
                            onClick = {
                                viewModel.sortBy = "size"
                                isSortMenuExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Most Played Count") },
                            onClick = {
                                viewModel.sortBy = "playCount"
                                isSortMenuExpanded = false
                            }
                        )
                    }
                }
            }
        }

        // Category Content Rendering
        when (viewModel.selectedCategoryTab) {
            0 -> {
                // Tracks Tab
                items(filteredTracks) { track ->
                    TrackItem(
                        track = track,
                        viewModel = viewModel,
                        isActive = viewModel.currentTrack?.id == track.id
                    )
                }
            }
            1 -> {
                // Albums Grouped View
                val albums = filteredTracks.groupBy { it.album }
                items(albums.entries.toList()) { entry ->
                    val albumName = entry.key
                    val tracksInAlbum = entry.value
                    val firstTrack = tracksInAlbum.first()

                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable {
                                viewModel.playTrack(firstTrack)
                            },
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(50.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(Color(firstTrack.coverGradient.first())),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Album, contentDescription = null, tint = Color.White)
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = albumName,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${firstTrack.artist} • ${tracksInAlbum.size} tracks • ${firstTrack.year}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            IconButton(onClick = { viewModel.playTrack(firstTrack) }) {
                                Icon(Icons.Default.PlayCircle, contentDescription = "Play Album", tint = AuraPrimary)
                            }
                        }
                    }
                }
            }
            2 -> {
                // Artists Grouped View
                val artists = filteredTracks.groupBy { it.artist }
                items(artists.entries.toList()) { entry ->
                    val artistName = entry.key
                    val tracks = entry.value
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { viewModel.playTrack(tracks.first()) },
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(androidx.compose.foundation.shape.CircleShape)
                                    .background(AuraPrimary.copy(alpha = 0.25f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = artistName.take(2).uppercase(),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = AuraPrimary
                                )
                            }
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = artistName,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${tracks.size} songs • Lossless available",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Icon(Icons.Default.ChevronRight, contentDescription = null, tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
            3 -> {
                // Genres View
                val genres = filteredTracks.groupBy { it.genre }
                items(genres.entries.toList()) { entry ->
                    val genreName = entry.key
                    val tracks = entry.value
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { viewModel.playTrack(tracks.first()) },
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Category, contentDescription = null, tint = AuraSecondary)
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = genreName,
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "${tracks.size} tracks in library",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
            4 -> {
                // Folders View
                val folders = filteredTracks.groupBy { it.folderPath }
                items(folders.entries.toList()) { entry ->
                    val folderPath = entry.key
                    val tracks = entry.value
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp)
                            .clip(RoundedCornerShape(12.dp)),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(Icons.Default.Folder, contentDescription = null, tint = Color(0xFFF59E0B))
                            Spacer(modifier = Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = folderPath.substringAfterLast("/"),
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "$folderPath • ${tracks.size} files",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
