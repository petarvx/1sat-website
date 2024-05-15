"use client";

import type { AssetType } from "@/constants";
import { bsv20Balances, chainInfo } from "@/signals/wallet";
import { computed } from "@preact/signals-react";
import { useSignal } from "@preact/signals-react/runtime";
import TremorChartComponent, { ChartStyle, DataCategory } from "./chart";
import type { MarketData } from "./list";

const TickerContent = ({
  ticker,
  show,
  type,
}: {
  ticker: MarketData;
  show: boolean;
  type: AssetType.BSV20 | AssetType.BSV21;
}) => {
  const currentHeight = computed(() => {
    return chainInfo.value?.blocks || 0;
  });

  const ownsTicker = computed(() => {
    return bsv20Balances.value?.some((b) => {
      // TODO: Fix for v2
      return b.tick === ticker.tick || b.sym === ticker.tick;
    });
  });

  // state for closing the listing form to return to chart
  const showListingForm = useSignal(ownsTicker.value || false);
  return (
    show && (
      <div className="transition bg-base-200 flex py-4 w-full">
        <div className="w-1/2 align-top">
          <TremorChartComponent
            ticker={ticker}
            dataCategory={DataCategory.Listings}
            chartStyle={ChartStyle.Bubble}
            currentHeight={currentHeight.value}
            showListingForm={showListingForm}
          />
        </div>
        <div className="w-1/2 align-top">
          <TremorChartComponent
            ticker={ticker}
            dataCategory={DataCategory.Sales}
            chartStyle={ChartStyle.Line}
            currentHeight={currentHeight.value}
          />
        </div>
      </div>

    )
  );
};

export default TickerContent;