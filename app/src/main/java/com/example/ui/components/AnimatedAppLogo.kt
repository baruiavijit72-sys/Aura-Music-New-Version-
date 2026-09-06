package com.example.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

/**
 * Animated dynamic glowing emblem with breathing neon ripples,
 * spinning gradient border orbit, and dynamic equalizer soundwave bars.
 */
@Composable
fun AnimatedAppLogo(
    modifier: Modifier = Modifier,
    size: Dp = 80.dp
) {
    val infiniteTransition = rememberInfiniteTransition(label = "logo_anim")

    // Continuous rotation for neon orbital gradient ring
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 5000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )

    // Breathing pulse scale effect
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.94f,
        targetValue = 1.08f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1800, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    // Outer ripple wave expansion (0.8f to 1.35f)
    val rippleScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.38f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ripple"
    )

    // Outer ripple alpha fade
    val rippleAlpha by infiniteTransition.animateFloat(
        initialValue = 0.65f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 2200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rippleAlpha"
    )

    // Secondary ripple with slight phase offset
    val ripple2Scale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.25f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ripple2"
    )

    val ripple2Alpha by infiniteTransition.animateFloat(
        initialValue = 0.50f,
        targetValue = 0.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1600, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "ripple2Alpha"
    )

    // Equalizer wave bounce heights
    val eq1 by infiniteTransition.animateFloat(
        initialValue = 6f,
        targetValue = 22f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "eq1"
    )

    val eq2 by infiniteTransition.animateFloat(
        initialValue = 18f,
        targetValue = 8f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 550, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "eq2"
    )

    val eq3 by infiniteTransition.animateFloat(
        initialValue = 10f,
        targetValue = 26f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 350, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "eq3"
    )

    val eq4 by infiniteTransition.animateFloat(
        initialValue = 20f,
        targetValue = 9f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 480, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "eq4"
    )

    Box(
        modifier = modifier
            .size(size * 1.5f),
        contentAlignment = Alignment.Center
    ) {
        // Outer Expanding Cyan/Violet Ripple 1
        Box(
            modifier = Modifier
                .size(size * 1.35f)
                .scale(rippleScale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(
                            Color(0xFF6366F1).copy(alpha = rippleAlpha * 0.5f),
                            Color(0xFF06B6D4).copy(alpha = rippleAlpha * 0.25f),
                            Color.Transparent
                        )
                    )
                )
        )

        // Outer Expanding Neon Ripple 2
        Box(
            modifier = Modifier
                .size(size * 1.25f)
                .scale(ripple2Scale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(
                            Color(0xFFEC4899).copy(alpha = ripple2Alpha * 0.4f),
                            Color(0xFF8B5CF6).copy(alpha = ripple2Alpha * 0.2f),
                            Color.Transparent
                        )
                    )
                )
        )

        // Rotating Neon Border Ring
        Box(
            modifier = Modifier
                .size(size + 8.dp)
                .scale(pulseScale)
                .rotate(rotation)
                .clip(CircleShape)
                .background(
                    Brush.sweepGradient(
                        listOf(
                            Color(0xFF6366F1), // Indigo
                            Color(0xFF06B6D4), // Cyan
                            Color(0xFF10B981), // Mint
                            Color(0xFFF59E0B), // Amber
                            Color(0xFFEC4899), // Vivid Pink
                            Color(0xFF8B5CF6), // Purple
                            Color(0xFF6366F1)  // Back to Indigo
                        )
                    )
                )
        )

        // Dark Central Core Body with Pulsing Scale
        Box(
            modifier = Modifier
                .size(size)
                .scale(pulseScale)
                .clip(CircleShape)
                .background(
                    Brush.linearGradient(
                        listOf(
                            Color(0xFF0F172A),
                            Color(0xFF1E1B4B),
                            Color(0xFF0A0A14)
                        )
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            // Equalizer Frequency Wave Canvas inside core
            Canvas(
                modifier = Modifier.size(size * 0.65f)
            ) {
                val canvasWidth = this.size.width
                val canvasHeight = this.size.height
                val midY = canvasHeight / 2f

                val barWidth = 3.5.dp.toPx()
                val spacing = 7.dp.toPx()
                val totalBarsWidth = (4 * barWidth) + (3 * spacing)
                val startX = (canvasWidth - totalBarsWidth) / 2f

                val heights = listOf(eq1.dp.toPx(), eq2.dp.toPx(), eq3.dp.toPx(), eq4.dp.toPx())
                val barColors = listOf(
                    Color(0xFF38BDF8), // Cyan
                    Color(0xFF818CF8), // Indigo
                    Color(0xFFF472B6), // Pink
                    Color(0xFF34D399)  // Emerald
                )

                for (i in 0 until 4) {
                    val x = startX + (i * (barWidth + spacing)) + (barWidth / 2f)
                    val h = heights[i].coerceIn(4.dp.toPx(), canvasHeight * 0.8f)
                    drawLine(
                        color = barColors[i],
                        start = Offset(x, midY - (h / 2f)),
                        end = Offset(x, midY + (h / 2f)),
                        strokeWidth = barWidth,
                        cap = StrokeCap.Round
                    )
                }
            }

            // Foreground Floating Music Glow Icon overlay
            Icon(
                imageVector = Icons.Default.MusicNote,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.35f),
                modifier = Modifier
                    .size(size * 0.45f)
                    .align(Alignment.Center)
            )
        }
    }
}
