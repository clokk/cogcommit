"use client";

import React from "react";
import { TurnView, ToolOnlyGroup, formatGap, getGapMinutes } from "@cogcommit/ui";
import type { Turn } from "@cogcommit/types";

interface ConversationViewProps {
  turns: Turn[];
}

/**
 * Check if a turn is tool-only (no text content, only tool calls)
 */
function isToolOnlyTurn(turn: Turn): boolean {
  return (
    turn.role === "assistant" &&
    (!turn.content || turn.content.trim() === "") &&
    !!turn.toolCalls &&
    turn.toolCalls.length > 0
  );
}

type RenderItem =
  | { type: "turn"; turn: Turn; gapMinutes: number | null }
  | { type: "tool-group"; turns: Turn[]; gapMinutes: number | null };

function buildRenderItems(turns: Turn[]): RenderItem[] {
  const items: RenderItem[] = [];
  let prevTimestamp: string | null = null;
  let currentToolGroup: Turn[] = [];
  let toolGroupGap: number | null = null;

  const flushToolGroup = () => {
    if (currentToolGroup.length > 0) {
      items.push({
        type: "tool-group",
        turns: currentToolGroup,
        gapMinutes: toolGroupGap,
      });
      currentToolGroup = [];
      toolGroupGap = null;
    }
  };

  for (const turn of turns) {
    const gapMinutes = prevTimestamp
      ? getGapMinutes(prevTimestamp, turn.timestamp)
      : null;

    if (isToolOnlyTurn(turn)) {
      if (currentToolGroup.length === 0) {
        toolGroupGap = gapMinutes;
      }
      currentToolGroup.push(turn);
    } else {
      flushToolGroup();
      items.push({ type: "turn", turn, gapMinutes });
    }

    prevTimestamp = turn.timestamp;
  }

  flushToolGroup();
  return items;
}

export default function ConversationView({ turns }: ConversationViewProps) {
  const renderItems = buildRenderItems(turns);

  return (
    <div className="space-y-4">
      {renderItems.map((item, idx) => {
        if (item.type === "tool-group") {
          const groupKey = item.turns.map((t) => t.id).join("-");
          return (
            <React.Fragment key={groupKey}>
              {/* Time gap divider */}
              {item.gapMinutes !== null && item.gapMinutes > 60 && (
                <div className="flex items-center gap-4 py-2 text-zinc-600 text-xs">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span>{formatGap(item.gapMinutes)} later</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </div>
              )}
              <ToolOnlyGroup turns={item.turns} />
            </React.Fragment>
          );
        }

        const { turn, gapMinutes } = item;
        return (
          <React.Fragment key={turn.id}>
            {/* Time gap divider */}
            {gapMinutes !== null && gapMinutes > 60 && (
              <div className="flex items-center gap-4 py-2 text-zinc-600 text-xs">
                <div className="flex-1 h-px bg-zinc-800" />
                <span>{formatGap(gapMinutes)} later</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}
            <TurnView turn={turn} />
          </React.Fragment>
        );
      })}
    </div>
  );
}
