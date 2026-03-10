ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event

  event.register(
    Commands.literal('blyat').executes(ctx => {
      ctx.source.server.runCommandSilent(`shader remove ${ctx.source.player.getName().getString()}`)
	  ctx.source.player.tell(Component.green("Шейдер успешно снят!"));
      return 1
    })
  )
})