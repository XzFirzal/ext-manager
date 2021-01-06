declare module 'ext-manager' {
    import Collection from '@discordjs/collection'
    import { EventEmitter } from 'events'

    export const version: String

    interface EventExt {
        name: String;
        main: Function;
        once?: Boolean;
    }

    export class EventManager {
      constructor(emitter: EventEmitter);

      public extensions: Collection<String, Array<EventExt>>;
      public loadExtension(paths: String): Promise<Array<String>>;
      public reloadExtension(paths: String): Promise<Array<String>>;
      public unloadExtension(paths: String): Promise<Array<String>>;
    }

    import { Client, ClientOptions, Message, PermissionResolvable, MessageEmbed } from 'discord.js'

    interface BotOptions extends ClientOptions {
        prefix: Array<Function | String> | Function | String;
        owner?: Array<String>;
        filters?: Array<Function>;
        respondBot?: Boolean;
        ownerBypass?: Boolean;
        insensitive?: Boolean;
        helpCommand?: {
            embed?: MessageEmbed;
            hideDuplicate?: Boolean;
            decorator?: {
                group?: {
                    title?: String;
                    separator?: String;
                }
                command?: {
                    title?: String;
                    separator?: String;
                    notFound?: String;
                }
            }
        };
        extensionCommand?: {
            embed?: MessageEmbed;
        };
        evalCommand?: {
            embed?: MessageEmbed;
        };
    }

    interface Cooldown {
        limit?: Number;
        timoeut?: Number;
        target?: 'guild' | 'channel' | 'author';
        response?: String;
    }

    interface BotEventExt extends EventExt {
        type: 'event';
    }

    interface Permission {
        type: 'guild' | 'channel';
        perms: PermissionResolvable;
        optional?: Boolean;
        response?: String;
    }

    interface Arg {
        position: Number;
        response?: String;
        prompt?: {
            timeout?: Number;
            cancelled?: String;
            failed?: String;
            timedOut?: String;
        }
    }

    interface BotCommandExt {
        type: 'command';
        name: String;
        main: Function;
        category?: String;
        aliases?: Array<String>;
        description?: String;
        guildOnly?: Boolean;
        ownerOnly?: Boolean;
        usage?: String;
        notes?: String;
        cooldown?: Cooldown;
        permission?: Permission;
        botPermission?: Permission;
        args?: Array<Arg>;
    }

    class Command {
      constructor(options: BotCommandExt);
      public main(message: Message, args: Array<String>, prefix: String, CMD: BotCommandExt): void;
    }

    interface CommandList {
        HelpCommand: Command;
        EvalCommand: Command;
        ExtensionCommand: Command;
    }

    class CommandManager extends EventEmitter {
        collection: Collection<String, BotCommandExt>;
        cooldown: Collection<String, Cooldown>;
    }

    export class Bot extends Client {
      constructor(options: BotOptions);

        public extensions: Collection<String, Array<BotEventExt | BotCommandExt>>;
        public commands: CommandManager;
        public loadExtension(paths: String): Promise<Array<string>>;
        public reloadExtension(paths: String): Promise<Array<String>>;
        public unloadExtension(paths: String): Promise<Array<String>>;
    }

    export function Commands(): CommandList;
}
