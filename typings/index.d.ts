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
        response?: String;
    }

    interface permission {
        type: 'guild' | 'channel';
        perms: PermissionResolvable;
        optional?: Boolean;
        response?: String;
    }

    interface arg {
        position: Number;
        response?: String;
        prompt?: {
            timeout?: Number;
            cancelled?: String;
            failed?: String;
            timedOut?: String;
        }
    }

    interface botEventExt extends eventExt {
        type: 'event';
    }

    interface botCommandExt {
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

declare module 'ext-manager' {
    namespace manager {
        const version: String

        interface ext {
            ext: ext;
        }

        interface Commands {
            HelpCommand: ext.Command;
            EvalCommand: ext.Command;
            ExtensionCommand: ext.Command;
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
