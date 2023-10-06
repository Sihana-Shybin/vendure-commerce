/* eslint-disable no-console */
import { AdminUiPlugin } from '@vendure/admin-ui-plugin';
import { AssetServerPlugin } from '@vendure/asset-server-plugin';
import { ADMIN_API_PATH, API_PORT, SHOP_API_PATH } from '@vendure/common/lib/shared-constants';
import {
    Asset,
    DefaultJobQueuePlugin,
    DefaultLogger,
    DefaultSearchPlugin,
    dummyPaymentHandler,
    LanguageCode,
    LogLevel,
    VendureConfig,
    ProductEvent,
    ProductVariantEvent
} from '@vendure/core';
import { ElasticsearchPlugin } from '@vendure/elasticsearch-plugin';
import { defaultEmailHandlers, EmailPlugin } from '@vendure/email-plugin';
import { BullMQJobQueuePlugin } from '@vendure/job-queue-plugin/package/bullmq';
import 'dotenv/config';
import { compileUiExtensions } from '@vendure/ui-devkit/compiler';
import path from 'path';
import * as fs from 'fs';
import data from "./mapping/indexProperties.json";
import { DataSourceOptions } from 'typeorm';

import { MultivendorPlugin } from './example-plugins/multivendor-plugin/multivendor.plugin';

import { WebhookPlugin } from 'vendure-plugin-webhook/dist/webhook.plugin';
import { RequestTransformer } from 'vendure-plugin-webhook/dist/api/request-transformer';
import { stringify } from 'circular-json';

const stringifyProductTransformer = new RequestTransformer({
    name: 'Stringify Product events',
    supportedEvents: [ProductEvent],
    transform: (event, injector) => {
        if (event instanceof ProductEvent) {
            return {
                body: stringify(event),
                headers: {
                    'x-custom-header': 'custom-example-header',
                    'content-type': 'application/json',
                },
            };
        } else {
            throw Error(`This transformer is only for ProductEvents!`);
        }
    },
});

/**
 * Config settings used during development
 */
export const devConfig: VendureConfig = {
    apiOptions: {
        port: API_PORT,
        adminApiPath: ADMIN_API_PATH,
        adminApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },
        adminApiDebug: true,
        shopApiPath: SHOP_API_PATH,
        shopApiPlayground: {
            settings: {
                'request.credentials': 'include',
            } as any,
        },
        shopApiDebug: true,
    },
    authOptions: {
        disableAuth: false,
        tokenMethod: ['bearer', 'cookie'] as const,
        requireVerification: true,
        customPermissions: [],
        cookieOptions: {
            secret: 'abc',
        },
    },
    dbConnectionOptions: {
        synchronize: false,
        logging: false,
        migrations: [path.join(__dirname, 'migrations/*.ts')],
        ...getDbConfig(),
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },

    customFields: {},
    logger: new DefaultLogger({ level: LogLevel.Verbose }),
    importExportOptions: {
        importAssetsDir: path.join(__dirname, 'import-assets'),
    },
    plugins: [
        // MultivendorPlugin.init({
        //     platformFeePercent: 10,
        //     platformFeeSKU: 'FEE',
        // }),
        AssetServerPlugin.init({
            route: 'assets',
            assetUploadDir: path.join(__dirname, 'assets'),
        }),
        // DefaultSearchPlugin.init({ bufferUpdates: false, indexStockStatus: false }),
        // BullMQJobQueuePlugin.init({}),
        // DefaultJobQueuePlugin.init({}),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        // JobQueueTestPlugin.init({ queueCount: 10 }),
        // ElasticsearchPlugin.init({
        //     host: 'http://localhost',
        //     port: 9200,
        //     bufferUpdates: true,
        // }),
        ElasticsearchPlugin.init({
            clientOptions: {
                auth: {
                    username: process.env.ELASTIC_USERNAME || 'elastic',
                    password: process.env.ELASTIC_PASSWORD || 'Th2uiFYm0+Pp4zyhOXyk',
                },
                ssl: {
                    cert: fs.readFileSync(path.resolve(__dirname, 'http_ca.crt')),
                    rejectUnauthorized: false
                }
            },
            indexPrefix: "search-vendure-",
            indexSettings: data.settings,
            indexMappingProperties: data.properties,
            bufferUpdates: true
        }),
        EmailPlugin.init({
            devMode: true,
            route: 'mailbox',
            handlers: defaultEmailHandlers,
            templatePath: path.join(__dirname, '../email-plugin/templates'),
            outputPath: path.join(__dirname, 'test-emails'),
            globalTemplateVars: {
                verifyEmailAddressUrl: 'http://localhost:4201/verify',
                passwordResetUrl: 'http://localhost:4201/reset-password',
                changeEmailAddressUrl: 'http://localhost:4201/change-email-address',
            },
        }),
        AdminUiPlugin.init({
            route: 'admin',
            port: 5001,
            app: compileUiExtensions({
                outputPath: path.join(__dirname, './custom-admin-ui'),
                // Add the WebhookPlugin's UI to the admin
                extensions: [WebhookPlugin.ui],
                devMode: true,
            }),
            // Un-comment to compile a custom admin ui
            // app: compileUiExtensions({
            //     outputPath: path.join(__dirname, './custom-admin-ui'),
            //     extensions: [
            //         {
            //             id: 'test-ui-extension',
            //             extensionPath: path.join(__dirname, 'test-plugins/with-ui-extension/ui'),
            //             ngModules: [
            //                 {
            //                     type: 'lazy',
            //                     route: 'greetz',
            //                     ngModuleFileName: 'greeter.module.ts',
            //                     ngModuleName: 'GreeterModule',
            //                 },
            //                 {
            //                     type: 'shared',
            //                     ngModuleFileName: 'greeter-shared.module.ts',
            //                     ngModuleName: 'GreeterSharedModule',
            //                 },
            //             ],
            //         },
            //         {
            //             globalStyles: path.join(
            //                 __dirname,
            //                 'test-plugins/with-ui-extension/ui/custom-theme.scss',
            //             ),
            //         },
            //         {
            //             id: 'external-ui-extension',
            //             extensionPath: path.join(__dirname, 'test-plugins/with-external-ui-extension'),
            //             ngModules: [
            //                 {
            //                     type: 'lazy',
            //                     route: 'greet',
            //                     ngModuleFileName: 'external-ui-extension.ts',
            //                     ngModuleName: 'ExternalUiExtensionModule',
            //                 },
            //             ],
            //             staticAssets: [
            //                 {
            //                     path: path.join(__dirname, 'test-plugins/with-external-ui-extension/app'),
            //                     rename: 'external-app',
            //                 },
            //             ],
            //         },
            //     ],
            //     devMode: true,
            // }),
        }),
        WebhookPlugin.init({
            /**
             * Optional: 'delay' waits and deduplicates events for 3000ms.
             * If 4 events were fired for the same channel within 3 seconds,
             * only 1 webhook call will be sent
             */
            delay: 3000,
            events: [ProductEvent, ProductVariantEvent],
            requestTransformers: [stringifyProductTransformer],
            /**
             * Optional: 'requestFn' allows you to send custom headers
             * and a custom body with your webhook call.
             * By default, the webhook POST will have an empty body
             */
            // requestFn: async (
            //   event: ProductEvent | ProductVariantEvent,
            //   injector: Injector
            // ) => {
            //   // Get data via injector and build your request headers and body
            //   const { id } = await injector
            //     .get(ChannelService)
            //     .getChannelFromToken(event.ctx.channel.token);
            //   return {
            //     headers: { test: '1234' },
            //     body: JSON.stringify({ createdAt: event.createdAt, channelId: id }),
            //   };
            // },
        }),
    ],
};

function getDbConfig(): DataSourceOptions {
    const dbType = process.env.DB || 'postgres';
    switch (dbType) {
        case 'postgres':
            console.log('Using postgres connection');
            return {
                synchronize: false,
                type: 'postgres',
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 5432,
                username: process.env.DB_USERNAME || 'postgres',
                password: process.env.DB_PASSWORD || 'Admin@123',
                database: process.env.DB_NAME || 'vendure',
                schema: process.env.DB_SCHEMA || 'public',
            };
        case 'sqlite':
            console.log('Using sqlite connection');
            return {
                synchronize: false,
                type: 'better-sqlite3',
                database: path.join(__dirname, 'vendure.sqlite'),
            };
        case 'sqljs':
            console.log('Using sql.js connection');
            return {
                type: 'sqljs',
                autoSave: true,
                database: new Uint8Array([]),
                location: path.join(__dirname, 'vendure.sqlite'),
            };
        case 'mysql':
        default:
            console.log('Using mysql connection');
            return {
                synchronize: true,
                type: 'mariadb',
                host: '127.0.0.1',
                port: 3306,
                username: 'root',
                password: '',
                database: 'vendure2-dev',
            };
    }
}
