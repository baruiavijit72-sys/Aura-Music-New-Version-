package com.example.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.model.P2PDevice
import com.example.model.TransferStatus
import com.example.state.AuraViewModel
import com.example.ui.components.QrCodeView
import com.example.ui.components.TrackItem
import com.example.ui.theme.AuraPrimary
import com.example.ui.theme.AuraSecondary
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun P2PSharingScreen(
    viewModel: AuraViewModel,
    modifier: Modifier = Modifier
) {
    var shareMode by remember { mutableIntStateOf(0) } // 0: Send Mode, 1: Receive Mode, 2: Transfer History Logs
    var isQrModalOpen by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentPadding = PaddingValues(bottom = 120.dp)
    ) {
        // Hero Card: Zero-Data High-Speed P2P
        item {
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surfaceVariant,
                tonalElevation = 4.dp
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(
                                        Brush.linearGradient(
                                            listOf(AuraSecondary, AuraPrimary)
                                        )
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.WifiTethering,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text(
                                    text = "Aura Wireless P2P",
                                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Zero-Data • 50+ MB/s Wi-Fi Direct",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AuraSecondary
                                )
                            }
                        }

                        IconButton(onClick = { isQrModalOpen = true }) {
                            Icon(
                                imageVector = Icons.Default.QrCode2,
                                contentDescription = "QR Pairing",
                                tint = AuraPrimary,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(14.dp))

                    // Transfer Mode Selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = { shareMode = 0 },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (shareMode == 0) AuraPrimary else MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Upload,
                                contentDescription = null,
                                tint = if (shareMode == 0) Color.White else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "Send Music",
                                color = if (shareMode == 0) Color.White else MaterialTheme.colorScheme.onSurface,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }

                        Button(
                            onClick = {
                                shareMode = 1
                                viewModel.startP2PDiscovery()
                            },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (shareMode == 1) AuraSecondary else MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Download,
                                contentDescription = null,
                                tint = if (shareMode == 1) Color.Black else MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                "Receive",
                                color = if (shareMode == 1) Color.Black else MaterialTheme.colorScheme.onSurface,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }

                        IconButton(
                            onClick = { shareMode = 2 },
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (shareMode == 2) AuraPrimary.copy(alpha = 0.2f) else MaterialTheme.colorScheme.surface)
                        ) {
                            Icon(
                                imageVector = Icons.Default.History,
                                contentDescription = "History",
                                tint = if (shareMode == 2) AuraPrimary else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }
            }
        }

        // Live Active Transfer Simulation Card
        if (viewModel.isP2PTransferring) {
            item {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 6.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF0F172A),
                    shadowElevation = 6.dp
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                CircularProgressIndicator(
                                    progress = { viewModel.p2pTransferProgress },
                                    modifier = Modifier.size(24.dp),
                                    color = AuraSecondary,
                                    strokeWidth = 3.dp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Text(
                                    text = "Transferring ${viewModel.p2pSelectedTrackIds.size} Lossless Files...",
                                    style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color.White
                                )
                            }

                            Text(
                                text = "${(viewModel.p2pTransferProgress * 100).toInt()}%",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = AuraSecondary
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        LinearProgressIndicator(
                            progress = { viewModel.p2pTransferProgress },
                            modifier = Modifier.fillMaxWidth().height(6.dp),
                            color = AuraSecondary,
                            trackColor = Color.DarkGray
                        )

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Speed: ${String.format("%.1f", viewModel.p2pTransferSpeedMbps)} MB/s",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.LightGray
                            )
                            Text(
                                text = "Wi-Fi Direct 5GHz • Channel 44",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color.Gray
                            )
                        }
                    }
                }
            }
        }

        when (shareMode) {
            0 -> {
                // SEND MODE: Track Selection & Nearby Targets
                item {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Select Tracks to Share (${viewModel.p2pSelectedTrackIds.size} selected)",
                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )

                        Row {
                            TextButton(onClick = { viewModel.selectAllForP2P() }) {
                                Text("Select All", style = MaterialTheme.typography.labelSmall)
                            }
                            if (viewModel.p2pSelectedTrackIds.isNotEmpty()) {
                                TextButton(onClick = { viewModel.clearP2PSelection() }) {
                                    Text("Clear", style = MaterialTheme.typography.labelSmall)
                                }
                            }
                        }
                    }
                }

                // Send Target Action Button if items selected
                if (viewModel.p2pSelectedTrackIds.isNotEmpty()) {
                    item {
                        val context = androidx.compose.ui.platform.LocalContext.current
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 6.dp),
                            shape = RoundedCornerShape(14.dp),
                            color = AuraPrimary.copy(alpha = 0.15f)
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Button(
                                    onClick = {
                                        viewModel.shareTracksViaSystemIntent(context)
                                    },
                                    modifier = Modifier.fillMaxWidth().height(48.dp),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = AuraSecondary)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Share,
                                            contentDescription = null,
                                            tint = Color.Black,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text(
                                            text = "Transfer via Quick Share / Nearby Share (Files)",
                                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold),
                                            color = Color.Black
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(12.dp))

                                Text(
                                    text = "Or Send Directly via Wi-Fi Direct Peer:",
                                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                    color = AuraPrimary
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                viewModel.nearbyDevices.forEach { dev ->
                                    Surface(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(vertical = 4.dp)
                                            .clip(RoundedCornerShape(10.dp))
                                            .clickable {
                                                viewModel.simulateP2PTransfer(dev)
                                            },
                                        color = MaterialTheme.colorScheme.surface
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(10.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Icon(
                                                    imageVector = Icons.Default.PhoneAndroid,
                                                    contentDescription = null,
                                                    tint = AuraPrimary,
                                                    modifier = Modifier.size(22.dp)
                                                )
                                                Spacer(modifier = Modifier.width(10.dp))
                                                Column {
                                                    Text(
                                                        text = dev.name,
                                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold)
                                                    )
                                                    Text(
                                                        text = "${dev.connectionType} • Signal: ${dev.signalStrength}%",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                                    )
                                                }
                                            }

                                            Button(
                                                onClick = { viewModel.simulateP2PTransfer(dev) },
                                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text("Send Now", style = MaterialTheme.typography.labelSmall)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Track Selection List
                items(viewModel.allTracks) { track ->
                    val isSelected = viewModel.p2pSelectedTrackIds.contains(track.id)
                    TrackItem(
                        track = track,
                        viewModel = viewModel,
                        showSelectCheckbox = true,
                        isSelectedForP2P = isSelected,
                        onSelectToggle = {
                            viewModel.toggleP2PTrackSelection(track.id)
                        }
                    )
                }
            }

            1 -> {
                // RECEIVE MODE: Radar Scanning Beacon & Nearby Senders
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Box(
                            modifier = Modifier
                                .size(130.dp)
                                .clip(CircleShape)
                                .background(AuraSecondary.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(90.dp)
                                    .clip(CircleShape)
                                    .background(AuraSecondary.copy(alpha = 0.35f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Sensors,
                                    contentDescription = "Radar",
                                    tint = AuraSecondary,
                                    modifier = Modifier.size(44.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Text(
                            text = "Visible to Nearby Devices",
                            style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Device Name: Pixel 9 Pro (Aura P2P Ready)\nAsk sender to scan QR or select your device name.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = androidx.compose.ui.text.style.TextAlign.Center
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Button(
                            onClick = { isQrModalOpen = true },
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AuraSecondary)
                        ) {
                            Icon(Icons.Default.QrCode, contentDescription = null, tint = Color.Black)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Show Receiver QR Code", color = Color.Black)
                        }
                    }
                }
            }

            2 -> {
                // TRANSFER HISTORY LOGS (Drift / SQLite persistent audit)
                item {
                    Text(
                        text = "Drift / SQLite Transfer History Logs",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }

                items(viewModel.transferLogs) { log ->
                    val sdf = remember { SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()) }
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 4.dp),
                        shape = RoundedCornerShape(12.dp),
                        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(
                                            if (log.isIncoming) Color(0xFF10B981).copy(alpha = 0.2f)
                                            else AuraPrimary.copy(alpha = 0.2f)
                                        ),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = if (log.isIncoming) Icons.Default.Download else Icons.Default.Upload,
                                        contentDescription = null,
                                        tint = if (log.isIncoming) Color(0xFF10B981) else AuraPrimary,
                                        modifier = Modifier.size(20.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Text(
                                        text = "${if (log.isIncoming) "Received from" else "Sent to"} ${log.targetDeviceName}",
                                        style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.SemiBold),
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        text = "${log.trackCount} files • ${log.totalSizeMb} MB • ${sdf.format(Date(log.timestamp))}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFF10B981).copy(alpha = 0.15f)
                            ) {
                                Text(
                                    text = "${String.format("%.1f", log.transferSpeedMbps)} MB/s",
                                    style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFF10B981),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // QR Code Pairing Dialog Modal
    if (isQrModalOpen) {
        AlertDialog(
            onDismissRequest = { isQrModalOpen = false },
            title = {
                Text(
                    text = "Aura Instant QR Pairing",
                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold)
                )
            },
            text = {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "Scan this QR code from the sending device to initiate zero-data Wi-Fi Direct handshake.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = androidx.compose.ui.text.style.TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    QrCodeView(
                        dataPayload = "aura://p2p/pair?id=dev_aura_pixel9&pin=${viewModel.qrCodePairingPin}&ip=192.168.49.1",
                        pinCode = viewModel.qrCodePairingPin
                    )
                }
            },
            confirmButton = {
                Button(onClick = { isQrModalOpen = false }) {
                    Text("Done")
                }
            }
        )
    }
}
