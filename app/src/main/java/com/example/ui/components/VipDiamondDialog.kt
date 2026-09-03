package com.example.ui.components

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.example.state.AuraViewModel

@Composable
fun VipDiamondDialog(
    viewModel: AuraViewModel,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    val clipboardManager = LocalClipboardManager.current
    var selectedPlanPrice by remember { mutableStateOf("199") }
    var utrInput by remember { mutableStateOf("") }
    var isActivatedSuccess by remember { mutableStateOf(false) }

    val phonePeUpi = "8777047129@ybl"
    val gPayUpi = "baruiavijit72@okaxis"
    val receiverName = "Avijit Barui"

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .fillMaxHeight(0.90f)
                .clip(RoundedCornerShape(28.dp)),
            color = Color(0xFF090B10),
            border = BorderStroke(
                1.5.dp,
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFFBBF24),
                        Color(0xFFF59E0B),
                        Color(0xFF6366F1),
                        Color(0xFF06B6D4)
                    )
                )
            ),
            shadowElevation = 24.dp
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header Bar with Close Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFF59E0B).copy(alpha = 0.15f),
                        border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.4f))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Diamond,
                                contentDescription = null,
                                tint = Color(0xFFFBBF24),
                                modifier = Modifier.size(16.dp)
                            )
                            Text(
                                text = "VIP DIAMOND PASS",
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Black,
                                    letterSpacing = 1.2.sp
                                ),
                                color = Color(0xFFFDE68A)
                            )
                        }
                    }

                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = Color.Gray
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Gold Diamond Icon & Title
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFFF59E0B), Color(0xFFFBBF24), Color(0xFFE11D48))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.WorkspacePremium,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = "Aura VIP Diamond",
                    style = MaterialTheme.typography.headlineSmall.copy(
                        fontWeight = FontWeight.Black,
                        fontSize = 24.sp
                    ),
                    color = Color.White
                )

                Text(
                    text = "Unlock 32-Bit Studio Mastering, Zero Ads & 100% Direct Bank Activation",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFA1A1AA),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Plan Selector (₹199 Lifetime Special / ₹399 Family VIP)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { selectedPlanPrice = "199" },
                        shape = RoundedCornerShape(16.dp),
                        color = if (selectedPlanPrice == "199") Color(0xFF1E1B4B) else Color(0xFF111827),
                        border = BorderStroke(
                            if (selectedPlanPrice == "199") 1.5.dp else 1.dp,
                            if (selectedPlanPrice == "199") Color(0xFFFBBF24) else Color(0xFF374151)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("LIFETIME PASS", style = MaterialTheme.typography.labelSmall, color = Color(0xFFFBBF24), fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("₹199", style = MaterialTheme.typography.titleLarge, color = Color.White, fontWeight = FontWeight.Black)
                            Text("One-Time Only", style = MaterialTheme.typography.bodySmall, color = Color.Gray, fontSize = 10.sp)
                        }
                    }

                    Surface(
                        modifier = Modifier
                            .weight(1f)
                            .clickable { selectedPlanPrice = "399" },
                        shape = RoundedCornerShape(16.dp),
                        color = if (selectedPlanPrice == "399") Color(0xFF1E1B4B) else Color(0xFF111827),
                        border = BorderStroke(
                            if (selectedPlanPrice == "399") 1.5.dp else 1.dp,
                            if (selectedPlanPrice == "399") Color(0xFFFBBF24) else Color(0xFF374151)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text("FAMILY VIP", style = MaterialTheme.typography.labelSmall, color = Color(0xFF38BDF8), fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("₹399", style = MaterialTheme.typography.titleLarge, color = Color.White, fontWeight = FontWeight.Black)
                            Text("Up to 5 Devices", style = MaterialTheme.typography.bodySmall, color = Color.Gray, fontSize = 10.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Direct Bank Receiver Card: Avijit Barui
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    color = Color(0xFF0F172A),
                    border = BorderStroke(1.dp, Color(0xFF10B981).copy(alpha = 0.4f))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = Color(0xFF10B981), modifier = Modifier.size(16.dp))
                                Text("Receiver: $receiverName", style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Bold), color = Color.White)
                            }
                            Surface(
                                shape = RoundedCornerShape(6.dp),
                                color = Color(0xFF10B981).copy(alpha = 0.2f)
                            ) {
                                Text("100% Direct", modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), color = Color(0xFF34D399), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        Spacer(modifier = Modifier.height(6.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("PhonePe / YBL: $phonePeUpi", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                            Text(
                                "Copy",
                                color = Color(0xFF38BDF8),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable {
                                    clipboardManager.setText(AnnotatedString(phonePeUpi))
                                    Toast.makeText(context, "UPI ID copied: $phonePeUpi", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Google Pay: $gPayUpi", style = MaterialTheme.typography.bodySmall, color = Color(0xFF94A3B8))
                            Text(
                                "Copy",
                                color = Color(0xFF38BDF8),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.clickable {
                                    clipboardManager.setText(AnnotatedString(gPayUpi))
                                    Toast.makeText(context, "UPI ID copied: $gPayUpi", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Direct 1-Tap UPI Launch Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val uri = Uri.parse("upi://pay?pa=$phonePeUpi&pn=${Uri.encode(receiverName)}&am=$selectedPlanPrice&cu=INR&tn=${Uri.encode("Aura Music VIP PRO")}")
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            try {
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Could not open UPI app. Please scan the QR code below.", Toast.LENGTH_LONG).show()
                            }
                        },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF581C87))
                    ) {
                        Text("Pay via PhonePe", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {
                            val uri = Uri.parse("upi://pay?pa=$gPayUpi&pn=${Uri.encode(receiverName)}&am=$selectedPlanPrice&cu=INR&tn=${Uri.encode("Aura Music VIP PRO")}")
                            val intent = Intent(Intent.ACTION_VIEW, uri)
                            try {
                                context.startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(context, "Could not open UPI app. Please scan the QR code below.", Toast.LENGTH_LONG).show()
                            }
                        },
                        modifier = Modifier.weight(1f).height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E3A8A))
                    ) {
                        Text("Pay via GPay", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // QR Code View for scanning with ANY UPI App
                QrCodeView(
                    dataPayload = "upi://pay?pa=$phonePeUpi&pn=${Uri.encode(receiverName)}&am=$selectedPlanPrice&cu=INR&tn=Aura%20Music%20VIP",
                    pinCode = "₹$selectedPlanPrice - Avijit Barui"
                )

                Spacer(modifier = Modifier.height(14.dp))

                // 12-Digit UTR / Transaction Reference Code Input
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF111827),
                    border = BorderStroke(1.dp, Color(0xFFF59E0B).copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "Enter 12-Digit UTR / Ref Number:",
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = Color(0xFFFDE68A)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        OutlinedTextField(
                            value = utrInput,
                            onValueChange = { utrInput = it.filter { ch -> ch.isDigit() || ch.isLetter() }.take(16) },
                            placeholder = { Text("e.g. 423984719284", color = Color.DarkGray) },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (isActivatedSuccess) {
                    Surface(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFF065F46)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.Center
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color.White)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("VIP Pass Activated! Enjoy Lossless Music.", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                } else {
                    Button(
                        onClick = {
                            if (utrInput.length < 8) {
                                Toast.makeText(context, "Please enter a valid UTR number (at least 8 characters).", Toast.LENGTH_SHORT).show()
                            } else {
                                isActivatedSuccess = true
                                viewModel.activateVip(utrInput)
                                Toast.makeText(context, "VIP Activated Successfully for Avijit Barui!", Toast.LENGTH_LONG).show()
                            }
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                    ) {
                        Text(
                            text = "Verify & Activate VIP Pass",
                            style = MaterialTheme.typography.bodyMedium.copy(fontWeight = FontWeight.Black),
                            color = Color.Black
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}
