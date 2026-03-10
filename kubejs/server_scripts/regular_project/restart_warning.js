// kubejs/server_scripts/restart_warning.js

const ZonedDateTime = Java.loadClass("java.time.ZonedDateTime");
const ZoneOffset = Java.loadClass("java.time.ZoneOffset");
const Duration = Java.loadClass("java.time.Duration");
const DateTimeFormatter = Java.loadClass("java.time.format.DateTimeFormatter");

let intervalHours = 6; // cron: 0 */6 * * *
let nextRestart = null;
let sentWarnings = new Set();

let restartSettings = {
  warnings: [
    { time: 30, message: "§eПерезагрузка через 30 минут", important: false },
    { time: 10, message: "§6Перезагрузка через 10 минут", important: false },
    { time: 5, message: "§c§lПерезагрузка через 5 минут!", important: true },
    { time: 1, message: "§4§lПерезагрузка через 1 минуту!", important: true },
  ],
};

function calculateNextRestartUTC() {
  let now = ZonedDateTime.now(ZoneOffset.UTC);

  let currentHour = now.getHour();
  let remainder = currentHour % intervalHours;
  let hoursToAdd = intervalHours - remainder;

  if (remainder === 0 && now.getMinute() === 0 && now.getSecond() === 0) {
    hoursToAdd = intervalHours;
  }

  let next = now.plusHours(hoursToAdd).withMinute(0).withSecond(0).withNano(0);

  nextRestart = next;
  sentWarnings.clear();
}

ServerEvents.loaded(() => {
  calculateNextRestartUTC();
  broadcastMessage("§aСистема уведомлений о рестарте активирована");
});

ServerEvents.tick((event) => {
  if (event.server.tickCount % 200 !== 0) return; // 10 sec

  if (!nextRestart) return;

  let now = ZonedDateTime.now(ZoneOffset.UTC);
  let duration = Duration.between(now, nextRestart);

  if (duration.isNegative() || duration.isZero()) return;

  let minutesLeft = Math.floor(duration.toMinutes());
  let secondsLeft = duration.getSeconds() % 60;

  restartSettings.warnings.forEach((warning) => {
    if (minutesLeft === warning.time && !sentWarnings.has(warning.time)) {
      broadcastMessage(warning.message, warning.important);
      sentWarnings.add(warning.time);
    }
  });

  if (minutesLeft === 0 && secondsLeft === 30 && !sentWarnings.has("30s")) {
    broadcastMessage("§4§l30 секунд до перезагрузки!", true);
    sentWarnings.add("30s");
  }
});

ServerEvents.commandRegistry((e) => {
  const { commands: Commands } = e;

  e.register(
    Commands.literal("restart")
      .then(
        Commands.literal("recalculate")
          .requires((player) => player.hasPermission(2))
          .executes((c) => {
            calculateNextRestartUTC();
            c.source.player.tell("§aВремя рестарта пересчитано.");
            return 1;
          }),
      )

      .then(
        Commands.literal("when").executes((c) => {
          let nextRestartMSK = nextRestart.plusHours(3); // UTC +3h

          let nowMSK = ZonedDateTime.now(ZoneOffset.UTC).plusHours(3); // + 3 as calculating diff in MSK timezone
          let duration = Duration.between(nowMSK, nextRestartMSK);

          if (duration.isNegative() || duration.isZero()) {
            c.source.player.tell("§cРестарт ожидается с минуты на минуту.");
            return 1;
          }

          let minutes = Math.floor(duration.toMinutes());
          let seconds = duration.getSeconds() % 60;

          let formatter = DateTimeFormatter.ofPattern("HH:mm 'MSK'");

          let formatted = nextRestartMSK.format(formatter);

          c.source.player.tell(`§eСледующий рестарт: §6${formatted}`);

          c.source.player.tell(`§eДо рестарта: §6${minutes}м ${seconds}с`);

          return 1;
        }),
      ),
  );
});
