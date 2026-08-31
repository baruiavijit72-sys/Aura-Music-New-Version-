package com.example.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.state.AuraViewModel
import com.example.ui.theme.AuraPrimary

@Composable
fun SleepTimerDialog(
    viewModel: AuraViewModel,
    onDismiss: () -> Unit
) {
    val options = listOf(
        15 to "15 Minutes",
        30 to "30 Minutes",
        45 to "45 Minutes",
        60 to "60 Minutes",
        90 to "90 Minutes",
        0 to "Turn Off Sleep Timer"
    )

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Bedtime,
                    contentDescription = null,
                    tint = AuraPrimary
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text("Smart Sleep Timer", style = MaterialTheme.typography.titleLarge)
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = if (viewModel.isSleepTimerActive) "Current timer: ${viewModel.sleepTimerMinutesRemaining} mins remaining"
                    else "Playback will gently fade out and stop automatically.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(14.dp))

                options.forEach { (minutes, label) ->
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                viewModel.setSleepTimer(minutes)
                                onDismiss()
                            }
                            .padding(vertical = 8.dp),
                        shape = RoundedCornerShape(8.dp),
                        color = if (viewModel.sleepTimerMinutesRemaining == minutes && viewModel.isSleepTimerActive)
                            AuraPrimary.copy(alpha = 0.15f)
                        else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 14.dp, vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = label,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    fontWeight = if (viewModel.sleepTimerMinutesRemaining == minutes) FontWeight.Bold else FontWeight.Normal
                                ),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            if (viewModel.sleepTimerMinutesRemaining == minutes && viewModel.isSleepTimerActive) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = null,
                                    tint = AuraPrimary,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}
