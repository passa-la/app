package com.passala.countdown

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class Item : Record {
  @Field val id: String = ""
  @Field val title: String = ""
  @Field val text: String = ""
  @Field val at: Double = 0.0
}

class Plan : Record {
  @Field val id: String = ""
  @Field val title: String = ""
  @Field val text: String = ""
  @Field val start: Double = 0.0
  @Field val at: Double = 0.0
}

class CountdownModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("No React context")

  override fun definition() = ModuleDefinition {
    Name("Countdown")

    Function("show") { items: List<Item> ->
      val ctx = context
      Notes.clear(ctx, Notes.TAG)
      items.forEach { Notes.post(ctx, Notes.TAG, it.id, it.title, it.text, it.at.toLong(), false) }
    }

    Function("clear") {
      Notes.clear(context, Notes.TAG)
    }

    Function("plan") { items: List<Plan> ->
      val ctx = context
      val alarms = ctx.getSystemService(AlarmManager::class.java)
      val prefs = ctx.getSharedPreferences(Notes.PREFS, Context.MODE_PRIVATE)

      prefs.getStringSet("planned", emptySet())?.forEach { alarms.cancel(ring(ctx, it, null)) }

      items.forEach { p ->
        val pending = ring(ctx, p.id, p)
        val start = p.start.toLong()

        if (alarms.canScheduleExactAlarms()) {
          alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, start, pending)
        } else {
          alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, start, pending)
        }
      }

      prefs.edit().putStringSet("planned", items.map { it.id }.toSet()).apply()
    }

    Function("done") {
      val prefs = context.getSharedPreferences(Notes.PREFS, Context.MODE_PRIVATE)
      val all = prefs.getStringSet("done", emptySet())?.toList() ?: emptyList()
      prefs.edit().remove("done").apply()
      all
    }

    Function("end") { id: String ->
      Notes.cancel(context, Notes.ROUTINE, id)
    }
  }

  private fun ring(ctx: Context, id: String, p: Plan?): PendingIntent {
    val intent = Intent(ctx, Rings::class.java).setAction(Rings.RING).putExtra("id", id)

    if (p != null) {
      intent.putExtra("title", p.title).putExtra("text", p.text).putExtra("at", p.at.toLong())
    }

    return PendingIntent.getBroadcast(ctx, id.hashCode(), intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
  }
}
