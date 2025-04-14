import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// SVG Conversion settings schema
export const svgOptions = pgTable("svg_options", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  name: text("name").notNull(),
  fileFormat: text("file_format").notNull().default("svg"),
  svgVersion: text("svg_version").notNull().default("1.1"),
  drawStyle: text("draw_style").notNull().default("fillShapes"),
  shapeStacking: text("shape_stacking").notNull().default("placeCutouts"),
  groupBy: text("group_by").notNull().default("none"),
  lineFit: text("line_fit").notNull().default("medium"),
  allowedCurveTypes: text("allowed_curve_types").notNull().default("lines,quadraticBezier,cubicBezier,circularArcs,ellipticalArcs"),
  fillGaps: boolean("fill_gaps").notNull().default(true),
  clipOverflow: boolean("clip_overflow").notNull().default(false),
  nonScalingStroke: boolean("non_scaling_stroke").notNull().default(true),
  strokeWidth: text("stroke_width").notNull().default("2.0"),
});

// User schema - for saved settings and history
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
});

export const conversions = pgTable("conversions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  originalFilename: text("original_filename").notNull(),
  outputFormat: text("output_format").notNull(),
  createdAt: text("created_at").notNull(),
  optionsId: integer("options_id"),
});

// Create insert schemas
export const insertSvgOptionsSchema = createInsertSchema(svgOptions).pick({
  name: true,
  fileFormat: true,
  svgVersion: true,
  drawStyle: true,
  shapeStacking: true,
  groupBy: true,
  lineFit: true,
  allowedCurveTypes: true,
  fillGaps: true,
  clipOverflow: true,
  nonScalingStroke: true,
  strokeWidth: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
});

export const insertConversionSchema = createInsertSchema(conversions).pick({
  userId: true,
  originalFilename: true,
  outputFormat: true, 
  createdAt: true,
  optionsId: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSvgOptions = z.infer<typeof insertSvgOptionsSchema>;
export type SvgOptions = typeof svgOptions.$inferSelect;

export type InsertConversion = z.infer<typeof insertConversionSchema>;
export type Conversion = typeof conversions.$inferSelect;
