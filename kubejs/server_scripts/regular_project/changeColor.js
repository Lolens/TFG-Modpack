const COLORS = {
  //black: "0",
  //dark_blue: "1",
  dark_green: "2",
  dark_aqua: "3",
  dark_red: "4",
  dark_purple: "5",
  gold: "6",
  gray: "7",
  //"dark_gray": "8",
  blue: "9",
  green: "a",
  aqua: "b",
  red: "c",
  light_purple: "d",
  yellow: "e",
  white: "f",
};

const $FTBRanksAPI = Java.loadClass("dev.ftb.mods.ftbranks.api.FTBRanksAPI");

const $PermissionValue = Java.loadClass(
  "dev.ftb.mods.ftbranks.api.PermissionValue",
);

ServerEvents.commandRegistry((e) => {
  const {
    commands: Commands,
    arguments: Arguments,
    builtinSuggestions: Suggestions,
  } = e;

  e.register(
    Commands.literal("color")
      .then(
        Commands.argument("color", Arguments.STRING.create(e))
          .suggests((context, builder) => {
            Object.keys(COLORS).forEach((color) => {
              if ($FTBRanksAPI.manager().getRank(color).isPresent()) {
                builder.suggest(color);
              }
            });
            return builder.buildFuture();
          })
          .executes((c) => {
            let color = Arguments.STRING.getResult(c, "color");
            return changeColor(c.source.player, color);
          }),
      )
      .executes((c) => {
        return showAvailableColors(c.source.player);
      }),
  );
});

function changeColor(player, colorName) {
  let data = player.persistentData;

  let rankOpt = $FTBRanksAPI.manager().getRank(colorName);

  if (!rankOpt.isPresent()) {
    player.tell(Component.red(`Ранг '${colorName}' не найден!`));
    return 0;
  }

  if (data.currentColor === colorName) {
    player.tell(Component.gold(`У вас уже установлен цвет '${colorName}'`));
    return 1;
  }

  let currentRanks = $FTBRanksAPI
    .manager()
    .getAddedRanks(player.getGameProfile());

  if (data.currentColor) {
    let oldRankOpt = $FTBRanksAPI.manager().getRank(data.currentColor);
    if (oldRankOpt.isPresent()) {
      let oldRank = oldRankOpt.get();
      if (currentRanks.contains(oldRank)) {
        oldRank.remove(player.getGameProfile());
      }
    }
  }

  Object.keys(COLORS).forEach((color) => {
    if (color !== colorName) {
      let colorRankOpt = $FTBRanksAPI.manager().getRank(color);
      if (colorRankOpt.isPresent()) {
        let colorRank = colorRankOpt.get();
        if (currentRanks.contains(colorRank)) {
          colorRank.remove(player.getGameProfile());
        }
      }
    }
  });

  let newRank = rankOpt.get();
  newRank.add(player.getGameProfile());

  data.currentColor = colorName;

  player.tell(
    Component.green(`Ваш цвет изменен на: `).append(
      Component.of(colorName).color(colorName || "white"),
    ),
  );
  return 1;
}

function showAvailableColors(player) {
  let data = player.persistentData;
  let message = Component.of("=== Доступные цвета ===").gold();

  if (data.currentColor) {
    message = message.append(
      Component.of(`\nТекущий цвет: `)
        .gold()
        .append(
          Component.of(data.currentColor).color(data.currentColor || "white"),
        ),
    );
  }

  let hasAvailableColors = false;
  Object.keys(COLORS).forEach((color) => {
    let rankOpt = $FTBRanksAPI.manager().getRank(color);
    if (rankOpt.isPresent()) {
      message = message
        .append(Component.of("\n- "))
        .append(Component.of(color).color(color));
      hasAvailableColors = true;
    }
  });

  if (!hasAvailableColors) {
    player.tell(Component.red("Нет доступных цветных рангов!"));
  } else {
    player.tell(message);
    player.tell(
      Component.of("Используйте: ")
        .gold()
        .append(Component.of("/color <цвет>").white()),
    );
  }

  return 1;
}

let ranksInitialized = false;

PlayerEvents.loggedIn((event) => {
  if (ranksInitialized) return;
  ranksInitialized = true;

  console.log("Creating name color formatted ranks");

  Object.keys(COLORS).forEach((colorName, index) => {
    if ($FTBRanksAPI.manager().getRank(colorName).isPresent()) return;

    const power = 1000 - index;
    const colorCode = COLORS[colorName];

    const rank = $FTBRanksAPI.manager().createRank(colorName, colorName, power);

    rank.setPermission(
      "ftbranks.name_format",
      $PermissionValue.parse(`&${colorCode}{name}`),
    );

    console.log(`Created rank '${colorName}'`);
  });
});
