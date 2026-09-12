// src/map/styles.ts
// All React Native StyleSheet styles for the map screen.
// Importing from here keeps map.tsx under 200 lines.

import { StyleSheet } from "react-native";
import { C } from "../../theme";

export const mapStyles = StyleSheet.create({
  // ── Loading ───────────────────────────────────────────────
  loading: {
    flex: 1, backgroundColor: C.bgDark,
    alignItems: "center", justifyContent: "center",
  },
  loadingIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.primary + "22",
    alignItems: "center", justifyContent: "center",
  },
  loadingText:    { color: C.textOnDark, fontSize: 17, fontWeight: "700", marginTop: 12 },
  loadingSubText: { color: C.textMuted,  fontSize: 13, marginTop: 4 },

  // ── Top bar ───────────────────────────────────────────────
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: C.bgDark,
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center",
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  backBtn: {
    width: 36, height: 36, backgroundColor: C.bgMid,
    borderRadius: 10, alignItems: "center", justifyContent: "center",
  } as any,
  backArrow: { color: C.textOnDark, fontSize: 22, fontWeight: "300", lineHeight: 28 },
  topTitle:  { color: C.textOnDark, fontSize: 17, fontWeight: "700" },
  topSub:    { color: C.textMuted,  fontSize: 12, marginTop: 1 },
  connPill:  {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  connDot:  { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  connText: { fontSize: 12, fontWeight: "700" },

  // ── Glass status card ─────────────────────────────────────
  statusCardWrapper: {
    position: "absolute", bottom: 110, left: 16, right: 16, zIndex: 98,
    borderRadius: 24, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 10,
  },
  statusCard: {
    borderRadius: 24, padding: 16,
    backgroundColor: "rgba(15,23,42,0.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
  },
  statusHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  busBadge: {
    width: 34, height: 34, borderRadius: 12,
    backgroundColor: "rgba(99,102,241,0.20)",
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  busBadgeEmoji: { fontSize: 17 },
  statusBusNo:   { color: "#F8FAFC", fontSize: 17, fontWeight: "800", letterSpacing: 0.5 },
  liveDot:       { width: 9, height: 9, borderRadius: 5 },

  statusStatsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statCol:        { flex: 1, alignItems: "center", gap: 4 },
  statLabel:      { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1 },
  statValue:      { fontSize: 16, fontWeight: "800", color: "#F8FAFC" },
  statDivider:    { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.10)" },

  statusProgressTrack: {
    height: 8, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.10)", overflow: "hidden",
  },
  statusProgressFillWrap: { height: "100%" as any, borderRadius: 4, overflow: "hidden" },
  statusProgressPct: {
    marginTop: 6, textAlign: "center",
    fontSize: 11, fontWeight: "700", color: "#CBD5E1",
  },
  nextStopRow: {
    marginTop: 12, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)",
  },
  nextStopLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 1, marginBottom: 3 },
  nextStopName:  { fontSize: 14, fontWeight: "700", color: "#F8FAFC" },

  // ── Progress bar (RN layer) ───────────────────────────────
  progressBar: {
    position: "absolute", bottom: 90, left: 16, right: 16, zIndex: 99,
    backgroundColor: C.bgDark, borderRadius: 12, padding: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  progressLabels: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 6,
  },
  progressLabel: { fontSize: 10, color: C.textMuted, fontWeight: "600" },
  progressPct:   { fontSize: 12, color: C.textOnDark, fontWeight: "800" },
  progressTrack: {
    height: 6, backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 3, overflow: "hidden",
  },
  progressFill: { height: "100%" as any, borderRadius: 3, backgroundColor: C.primary },

  // ── Bottom bar ────────────────────────────────────────────
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 100,
    backgroundColor: C.bgDark, flexDirection: "row",
    paddingVertical: 18, paddingHorizontal: 20,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  bottomItem:    { flex: 1, alignItems: "center", gap: 5 },
  bottomLabel:   { fontSize: 9, fontWeight: "700", color: C.textMuted, letterSpacing: 1.2 },
  bottomValueLg: { fontSize: 20, fontWeight: "800" },
  bottomValue:   { fontSize: 14, fontWeight: "700", color: C.textOnDark },
  bottomDivider: { width: 1, height: 36, backgroundColor: C.bgMid, alignSelf: "center" },
  statusDot:     { width: 7, height: 7, borderRadius: 4 },
  legendText:    { fontSize: 10, color: C.textMuted, fontWeight: "600" },
});
