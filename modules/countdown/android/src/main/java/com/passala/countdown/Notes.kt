package com.passala.countdown

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object Notes {
  const val CHANNEL = "countdown"
  const val TAG = "countdown"
  const val ROUTINE = "routine"
  const val PREFS = "passala.countdown"

  fun post(ctx: Context, tag: String, id: String, title: String, text: String, at: Long, done: Boolean) {
    val now = System.currentTimeMillis()

    if (at <= now) {
      return
    }

    prepare(ctx)

    val builder = NotificationCompat.Builder(ctx, CHANNEL)
      .setSmallIcon(icon(ctx))
      .setContentTitle(title)
      .setContentText(text)
      .setWhen(at)
      .setShowWhen(true)
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setTimeoutAfter(at - now)
      .setCategory(NotificationCompat.CATEGORY_REMINDER)
      .setContentIntent(open(ctx))

    if (done) {
      val intent = Intent(ctx, Rings::class.java).setAction(Rings.DONE).putExtra("id", id)
      val pending = PendingIntent.getBroadcast(ctx, id.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
      builder.addAction(0, "Desci", pending)
    }

    try {
      NotificationManagerCompat.from(ctx).notify(tag, id.hashCode(), builder.build())
    } catch (_: SecurityException) {
    }
  }

  fun clear(ctx: Context, tag: String) {
    val manager = ctx.getSystemService(NotificationManager::class.java)
    manager.activeNotifications.filter { it.tag == tag }.forEach { manager.cancel(tag, it.id) }
  }

  fun cancel(ctx: Context, tag: String, id: String) {
    ctx.getSystemService(NotificationManager::class.java).cancel(tag, id.hashCode())
  }

  private fun prepare(ctx: Context) {
    val manager = ctx.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(NotificationChannel(CHANNEL, "Contagem dos ônibus", NotificationManager.IMPORTANCE_LOW))
  }

  private fun icon(ctx: Context): Int {
    val own = ctx.resources.getIdentifier("notification_icon", "drawable", ctx.packageName)

    return if (own != 0) own else ctx.applicationInfo.icon
  }

  private fun open(ctx: Context): PendingIntent? {
    val intent = ctx.packageManager.getLaunchIntentForPackage(ctx.packageName) ?: return null
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)

    return PendingIntent.getActivity(ctx, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }
}
