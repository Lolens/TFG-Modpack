PlayerEvents.loggedIn(event => {
event.player.tell(Component.green("Теперь сломанный шейдер после смерти можно сбросить с помощью команды '/blyat'"));
event.player.tell(Component.green("Доступна команда '/restart when', показывающая время до следующего рестарта"));
})