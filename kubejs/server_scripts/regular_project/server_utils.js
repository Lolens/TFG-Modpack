function broadcastMessage(text, important) {
  let server = Utils.getServer();
  let players = server.getPlayerList().getPlayers();

  let prefix = important
    ? "§4[ВНИМАНИЕ] "
    : "§6[ИНФО] ";

  players.forEach((player) => {
    player.tell(prefix + text);
  });
}