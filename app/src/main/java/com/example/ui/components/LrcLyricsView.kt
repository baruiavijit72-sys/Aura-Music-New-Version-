package com.example.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.MusicRepository
import com.example.model.Track
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary
import kotlinx.coroutines.launch

@Composable
fun LrcLyricsView(
    track: Track,
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val lyrics = remember(track.lyricsLrc) {
        MusicRepository.parseLrc(track.lyricsLrc)
    }

    val currentSec = viewModel.playbackPositionSeconds
    val activeIndex = lyrics.indexOfLast { it.timestampSeconds <= currentSec }.coerceAtLeast(0)

    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(activeIndex) {
        if (lyrics.isNotEmpty() && activeIndex in lyrics.indices) {
            coroutineScope.launch {
                listState.animateScrollToItem(
                    index = (activeIndex - 2).coerceAtLeast(0)
                )
            }
        }
    }

    if (lyrics.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "No synchronized LRC lyrics found for this track.\nUse Tag Editor to embed or import LRC.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(24.dp)
            )
        }
    } else {
        LazyColumn(
            state = listState,
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(vertical = 32.dp, horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            itemsIndexed(lyrics) { index, line ->
                val isActive = index == activeIndex
                val isPast = index < activeIndex

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isActive) AuraPrimary.copy(alpha = 0.15f) else Color.Transparent,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            viewModel.seekTo(line.timestampSeconds)
                        }
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = line.text,
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontSize = if (isActive) 19.sp else 16.sp,
                            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
                        ),
                        color = when {
                            isActive -> AuraPrimary
                            isPast -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
                            else -> MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.45f)
                        },
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}
