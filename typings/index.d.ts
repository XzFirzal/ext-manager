/* eslint-disable no-unused-vars */

import { EventEmitter } from 'events'
import { Client, ClientOptions, Message, PermissionResolvable, MessageEmbed, Collection } from 'discord.js'

declare namespace ext {
    interface eventExt {
        name: String;
        main: Function;
        once?: Boolean;
    }

    interface cooldown {
        limit?: Number;
        timoeut?: Number;
        target?: 'guild' | 'channel' | 'author';
        response?: String | MessageEmbed;
    }

    interface permission {
        type: 'guild' | 'channel';
        perms: PermissionResolvable;
        optional?: Boolean;
        response?: String | MessageEmbed;
    }

    interface arg {
        position: Number;
        response?: String | MessageEmbed;
        prompt?: {
            timeout?: Number;
            cancelled?: String | MessageEmbed;
            failed?: String | MessageEmbed;
            timedOut?: String | MessageEmbed;
        }
    }

    interface botEventExt extends eventExt {
        type: 'event';
    }

    interface botCommandExt {
        type: 'command';
        name: String;
        main(message: Message, args: String[], prefix: String, CMD: botCommandExt);
        category?: String;
        aliases?: Array<String>;
        description?: String;
        guildOnly?: String | MessageEmbed;
        ownerOnly?: String | MessageEmbed;
        usage?: String;
        notes?: String;
        cooldown?: cooldown;
        permission?: permission;
        botPermission?: permission;
        args?: Array<arg>;
    }

    interface botOptions extends ClientOptions {
        prefix: Array<Function | String> | Function | String;
        owner?: Array<String>;
        filters?: Array<Function>;
        respondBot?: Boolean;
        ownerBypass?: Boolean;
        insensitive?: Boolean;
        noPermission?: String | MessageEmbed;
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

    class Command {
      constructor(options: botCommandExt);

      public main(message: Message, args: Array<String>, prefix: String, CMD: botCommandExt): void;
    }

    class CommandManager extends EventEmitter {
        collection: Collection<String, botCommandExt>;
        cooldown: Collection<String, cooldown>;
    }
}

declare namespace Commands {
    class HelpCommand extends ext.Command { }

    class ExtensionCommand extends ext.Command { }

    class EvalCommand extends ext.Command { }
}

declare module 'ext-manager' {
    namespace manager {
        const version: String

        interface ext {
            ext: ext;
        }

        interface Commands {
            Commands: Commands;
        }

        class EventManager {
          constructor(emitter: EventEmitter);

            public extensions: Collection<String, Array<ext.eventExt>>;
            public loadExtension(paths: String): Promise<Array<String>>;
            public reloadExtension(paths: String): Promise<Array<String>>;
            public unloadExtension(paths: String): Promise<Array<String>>;
        }

        class Bot extends Client {
          constructor(options: ext.botOptions);

            public extensions: Collection<String, Array<ext.botEventExt | ext.botCommandExt>>;
            public commands: ext.CommandManager;
            public loadExtension(paths: String): Promise<Array<String>>;
            public reloadExtension(paths: String): Promise<Array<String>>;
            public unloadExtension(paths: String): Promise<Array<String>>;
        }
    }

    export = manager
}
