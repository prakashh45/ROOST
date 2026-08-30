const { z } = require("zod");
const settingSchema = z.object({ settingKey: z.string().min(2).max(100), settingValue: z.string().max(10000).nullable(), category: z.string().min(2).max(50).default("GENERAL"), description: z.string().max(1000).optional() });
const restoreSchema = z.object({ settings: z.array(settingSchema).min(1).max(200) });
module.exports = { settingSchema, restoreSchema };
