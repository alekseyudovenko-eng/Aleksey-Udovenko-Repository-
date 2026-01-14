import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, ComparisonOption } from './types';
import { generatePriceData, generateComparisonData } from './services/mockPriceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import ComparisonSelector from './components/ComparisonSelector';
import PriceChart from './components/PriceChart';
import ChartControls from './components/ChartControls';
import { TIMEFRAMES, COMPARISON_OPTIONS } from './constants';

const MIN_CANDLES_VISIBLE = 10; // Minimum number of candles to show when zooming in

const App: React.FC = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, endIndex: 0 });
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1M');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPriceInfo, setCurrentPriceInfo] = useState({
    price: 0,
    change: 0,
    changePercent: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const [comparisonOption, setComparisonOption] = useState<ComparisonOption>('NONE');
  const [comparisonData, setComparisonData] = useState<PriceData[] | null>(null);
  const [isComparisonLoading, setIsComparisonLoading] = useState<boolean>(false);

  const fetchData = useCallback(async (timeframe: Timeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await generatePriceData(timeframe);
      setPriceData(data);
      if (data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latestData = data[data.length - 1];
        const previousData = data.length > 1 ? data[data.length - 2] : latestData;
        const change = latestData.close - previousData.close;
        const changePercent = (change / previousData.close) * 100;
        setCurrentPriceInfo({
          price: latestData.close,
          change: change,
          changePercent: changePercent,
        });
      } else {
        setVisibleRange({ startIndex: 0, endIndex: 0 });
      }
    } catch (err) {
      setError('Failed to fetch price data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTimeframe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimeframe]);

  useEffect(() => {
    if (comparisonOption === 'NONE' || priceData.length === 0) {
      setComparisonData(null);
      return;
    }

    const fetchComparisonData = async () => {
      setIsComparisonLoading(true);
      try {
        const data = await generateComparisonData(activeTimeframe, comparisonOption, priceData);
        setComparisonData(data);
      } catch (err) {
        // Here you could set an error state for comparison data specifically
        console.error("Failed to load comparison data", err);
        setComparisonData(null);
      } finally {
        setIsComparisonLoading(false);
      }
    };

    fetchComparisonData();
  }, [comparisonOption, priceData, activeTimeframe]);

  const handleTimeframeChange = (timeframe: Timeframe) => {
    setActiveTimeframe(timeframe);
  };
  
  const handleComparisonChange = (option: ComparisonOption) => {
    setComparisonOption(option);
  };

  const handleRefresh = () => {
    fetchData(activeTimeframe);
  };
  
  // Chart Interaction Handlers
  const handleZoomIn = () => {
    const currentWidth = visibleRange.endIndex - visibleRange.startIndex;
    if (currentWidth <= MIN_CANDLES_VISIBLE) return;
    const zoomAmount = Math.floor(currentWidth * 0.1);
    setVisibleRange(prev => ({
      startIndex: prev.startIndex + zoomAmount,
      endIndex: prev.endIndex - zoomAmount,
    }));
  };

  const handleZoomOut = () => {
    const zoomAmount = Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.1);
    setVisibleRange(prev => ({
      startIndex: Math.max(0, prev.startIndex - zoomAmount),
      endIndex: Math.min(priceData.length, prev.endIndex + zoomAmount),
    }));
  };
  
  const handlePanLeft = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.1));
    const newStartIndex = Math.max(0, visibleRange.startIndex - panAmount);
    const width = visibleRange.endIndex - visibleRange.startIndex;
    setVisibleRange({
      startIndex: newStartIndex,
      endIndex: newStartIndex + width,
    });
  };

  const handlePanRight = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.1));
    const width = visibleRange.endIndex - visibleRange.startIndex;
    const newEndIndex = Math.min(priceData.length, visibleRange.endIndex + panAmount);
    setVisibleRange({
      startIndex: newEndIndex - width,
      endIndex: newEndIndex,
    });
  };

  const handleResetZoom = () => {
    setVisibleRange({ startIndex: 0, endIndex: priceData.length });
  };
  
  const visibleData = priceData.slice(visibleRange.startIndex, visibleRange.endIndex);
  const visibleComparisonData = comparisonData?.slice(visibleRange.startIndex, visibleRange.endIndex);

  const combinedVisibleData = visibleData.map((point, index) => ({
    ...point,
    comparisonClose: visibleComparisonData?.[index]?.close,
  }));

  const comparisonLabel = COMPARISON_OPTIONS.find(opt => opt.value === comparisonOption)?.label;

  const canPanLeft = visibleRange.startIndex > 0;
  const canPanRight = visibleRange.endIndex < priceData.length;
  const canZoomIn = (visibleRange.endIndex - visibleRange.startIndex) > MIN_CANDLES_VISIBLE;
  const canZoomOut = visibleRange.startIndex > 0 || visibleRange.endIndex < priceData.length;


  return (
    <div className="min-h-screen bg-light-secondary text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          priceInfo={currentPriceInfo}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
        <main className="mt-6">
          <div className="bg-light-primary rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 transition-all duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
               <div className="flex flex-wrap items-center gap-4">
                <TimeframeSelector
                  timeframes={TIMEFRAMES}
                  activeTimeframe={activeTimeframe}
                  onSelect={handleTimeframeChange}
                />
                <ComparisonSelector
                  options={COMPARISON_OPTIONS}
                  activeOption={comparisonOption}
                  onSelect={handleComparisonChange}
                />
              </div>
              <ChartControls 
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onPanLeft={handlePanLeft}
                onPanRight={handlePanRight}
                onReset={handleResetZoom}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                canPanLeft={canPanLeft}
                canPanRight={canPanRight}
              />
            </div>
            <div className="h-[500px] relative">
              {(isLoading || isComparisonLoading) && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              {error && (
                <div className="flex items-center justify-center h-full text-red-500">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && combinedVisibleData.length > 0 && (
                <PriceChart 
                  data={combinedVisibleData} 
                  comparisonLabel={comparisonOption !== 'NONE' ? comparisonLabel : null}
                />
              )}
               {!isLoading && !error && combinedVisibleData.length === 0 && priceData.length > 0 && (
                 <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No data in the selected range. Try panning or resetting the view.</p>
                </div>
              )}
            </div>
          </div>
        </main>
        <footer className="text-center text-gray-500 mt-8 text-sm">
          <p>FCPO Futures Price Tracker | Data is simulated for demonstration purposes.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
