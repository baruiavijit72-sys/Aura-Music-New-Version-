package com.example.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.data.MusicRepository
import com.example.state.AuraViewModel
import com.example.ui.components.DialKnob
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EqualizerScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    val sound = viewModel.soundSettings

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(bottom = 120.dp)
    ) {
        // Master Enable Header
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant,
            tonalElevation = 4.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "10-Band Audio Engine",
                        style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = if (sound.isEnabled) "32-bit Floating Point DSP Active" else "Equalizer Bypassed",
                        style = MaterialTheme.typography.bodySmall,
                        color = if (sound.isEnabled) AuraSecondary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Switch(
                    checked = sound.isEnabled,
                    onCheckedChange = { viewModel.toggleEqualizer(it) },
                    colors = SwitchDefaults.colors(checkedThumbColor = AuraPrimary, checkedTrackColor = AuraPrimary.copy(alpha = 0.5f))
                )
            }
        }

        // Preset Chips Selector
        Text(
            text = "SOUND PROFILES & PRESETS",
            style = MaterialTheme.typography.labelSmall.copy(
                letterSpacing = 1.2.sp,
                fontWeight = FontWeight.Bold
            ),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            MusicRepository.equalizerPresets.keys.forEach { presetName ->
                val isSelected = sound.currentPreset == presetName
                FilterChip(
                    selected = isSelected,
                    onClick = { viewModel.applyEqualizerPreset(presetName) },
                    label = {
                        Text(
                            text = presetName,
                            style = MaterialTheme.typography.labelMedium.copy(
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                            )
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = AuraPrimary,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Equalizer Frequency Curve Canvas
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            color = Color(0xFF0F172A)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Frequency Response Curve (-12dB to +12dB)",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.LightGray
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(90.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val width = size.width
                        val height = size.height
                        val midY = height / 2f

                        // Grid lines
                        drawLine(
                            color = Color.DarkGray.copy(alpha = 0.5f),
                            start = Offset(0f, midY),
                            end = Offset(width, midY),
                            strokeWidth = 1.dp.toPx()
                        )

                        // Smooth bezier path across 10 bands
                        val points = sound.bands.mapIndexed { index, band ->
                            val x = (index.toFloat() / (sound.bands.size - 1)) * width
                            // Map -12dB..+12dB to height..0
                            val normalized = ((band.gainDb + 12f) / 24f).coerceIn(0f, 1f)
                            val y = height - (normalized * height)
                            Offset(x, y)
                        }

                        val path = Path().apply {
                            if (points.isNotEmpty()) {
                                moveTo(points.first().x, points.first().y)
                                for (i in 0 until points.size - 1) {
                                    val p0 = points[i]
                                    val p1 = points[i + 1]
                                    val cx = (p0.x + p1.x) / 2f
                                    cubicTo(cx, p0.y, cx, p1.y, p1.x, p1.y)
                                }
                            }
                        }

                        drawPath(
                            path = path,
                            brush = Brush.horizontalGradient(listOf(AuraPrimary, AuraSecondary)),
                            style = Stroke(width = 3.dp.toPx())
                        )

                        // Draw Point dots
                        points.forEach { pt ->
                            drawCircle(
                                color = Color.White,
                                radius = 4.dp.toPx(),
                                center = pt
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 10-Band Sliders Column/Row
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = "10 Frequency Sliders",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    sound.bands.forEachIndexed { index, band ->
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.width(48.dp)
                        ) {
                            Text(
                                text = String.format("%+.1f", band.gainDb),
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                ),
                                color = if (band.gainDb != 0f) AuraPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            // Vertical Slider Simulation
                            Box(
                                modifier = Modifier
                                    .height(130.dp)
                                    .width(28.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Slider(
                                    value = band.gainDb,
                                    onValueChange = { viewModel.updateEqualizerBand(index, it) },
                                    valueRange = -12f..12f,
                                    modifier = Modifier
                                        .requiredSize(120.dp)
                                        .rotate(270f),
                                    colors = SliderDefaults.colors(
                                        thumbColor = AuraPrimary,
                                        activeTrackColor = AuraPrimary,
                                        inactiveTrackColor = MaterialTheme.colorScheme.outline
                                    )
                                )
                            }

                            Spacer(modifier = Modifier.height(4.dp))

                            Text(
                                text = band.frequencyLabel,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.SemiBold
                                ),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Sound Tuning Rotary Knobs (Bass Boost, 3D Virtualizer, Treble, Volume Boost)
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = "Acoustic Enhancements",
                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    DialKnob(
                        value = sound.bassBoost,
                        onValueChange = { viewModel.updateBassBoost(it) },
                        label = "Bass Boost",
                        activeColor = Color(0xFFEC4899)
                    )

                    DialKnob(
                        value = sound.virtualizer3D,
                        onValueChange = { viewModel.updateVirtualizer(it) },
                        label = "3D Virtualizer",
                        activeColor = AuraSecondary
                    )

                    DialKnob(
                        value = sound.trebleBoost,
                        onValueChange = { viewModel.updateTrebleBoost(it) },
                        label = "Treble Boost",
                        activeColor = AuraPrimary
                    )

                    DialKnob(
                        value = sound.volumeBoost,
                        onValueChange = { viewModel.updateVolumeBoost(it) },
                        label = "Loudness",
                        activeColor = Color(0xFF10B981)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Left / Right Stereo Audio Balance
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(16.dp),
            color = MaterialTheme.colorScheme.surfaceVariant
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Stereo Balance", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold))
                    Text(
                        text = when {
                            viewModel.volumeBalance < -0.1f -> "L ${(-viewModel.volumeBalance * 100).toInt()}%"
                            viewModel.volumeBalance > 0.1f -> "R ${(viewModel.volumeBalance * 100).toInt()}%"
                            else -> "Center"
                        },
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                        color = AuraPrimary
                    )
                }

                Slider(
                    value = viewModel.volumeBalance,
                    onValueChange = { viewModel.volumeBalance = it },
                    valueRange = -1f..1f,
                    colors = SliderDefaults.colors(thumbColor = AuraPrimary, activeTrackColor = AuraPrimary)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Left Channel", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("Right Channel", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
