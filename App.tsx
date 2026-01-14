
import React, { useState, useEffect, useCallback } from 'react';
import type { PriceData, Timeframe, ComparisonOption, GroundingSource } from './types';
import { fetchRealtimePriceData, fetchComparisonData } from './services/priceService';
import DashboardHeader from './components/DashboardHeader';
import TimeframeSelector from './components/TimeframeSelector';
import ComparisonSelector from './components/ComparisonSelector';
import PriceChart from './components/PriceChart';
import ChartControls from './components/ChartControls';
import { TIMEFRAMES, COMPARISON_OPTIONS } from './constants';

const MIN_CANDLES_VISIBLE = 5;

const App: React.FC = () => {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
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
      const { data, sources } = await fetchRealtimePriceData(timeframe);
      setPriceData(data);
      setSources(sources);
      
      if (data.length > 0) {
        setVisibleRange({ startIndex: 0, endIndex: data.length });
        const latestData = data[data.length - 1];
        const previousData = data.length > 1 ? data[data.length - 2] : latestData;
        const change = latestData.close - previousData.close;
        const changePercent = previousData.close !== 0 ? (change / previousData.close) * 100 : 0;
        
        setCurrentPriceInfo({
          price: latestData.close,
          change: change,
          changePercent: changePercent,
        });
      } else {
        setVisibleRange({ startIndex: 0, endIndex: 0 });
        setError('No recent price data found for the selected timeframe.');
      }
    } catch (err) {
      setError('Failed to fetch real-time price data. Searching market updates...');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeTimeframe);
  }, [activeTimeframe, fetchData]);

  useEffect(() => {
    if (comparisonOption === 'NONE' || priceData.length === 0) {
      setComparisonData(null);
      return;
    }

    const loadComparison = async () => {
      setIsComparisonLoading(true);
      try {
        const data = await fetchComparisonData(activeTimeframe, comparisonOption, priceData);
        setComparisonData(data);
      } catch (err) {
        console.error("Failed to load comparison data", err);
      } finally {
        setIsComparisonLoading(false);
      }
    };

    loadComparison();
  }, [comparisonOption, priceData, activeTimeframe]);

  const handleTimeframeChange = (timeframe: Timeframe) => setActiveTimeframe(timeframe);
  const handleComparisonChange = (option: ComparisonOption) => setComparisonOption(option);
  const handleRefresh = () => fetchData(activeTimeframe);
  
  const handleZoomIn = () => {
    const currentWidth = visibleRange.endIndex - visibleRange.startIndex;
    if (currentWidth <= MIN_CANDLES_VISIBLE) return;
    const zoomAmount = Math.max(1, Math.floor(currentWidth * 0.1));
    setVisibleRange(prev => ({
      startIndex: prev.startIndex + zoomAmount,
      endIndex: prev.endIndex - zoomAmount,
    }));
  };

  const handleZoomOut = () => {
    const zoomAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.1));
    setVisibleRange(prev => ({
      startIndex: Math.max(0, prev.startIndex - zoomAmount),
      endIndex: Math.min(priceData.length, prev.endIndex + zoomAmount),
    }));
  };
  
  const handlePanLeft = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.2));
    const width = visibleRange.endIndex - visibleRange.startIndex;
    const newStartIndex = Math.max(0, visibleRange.startIndex - panAmount);
    setVisibleRange({ startIndex: newStartIndex, endIndex: newStartIndex + width });
  };

  const handlePanRight = () => {
    const panAmount = Math.max(1, Math.floor((visibleRange.endIndex - visibleRange.startIndex) * 0.2));
    const width = visibleRange.endIndex - visibleRange.startIndex;
    const newEndIndex = Math.min(priceData.length, visibleRange.endIndex + panAmount);
    setVisibleRange({ startIndex: newEndIndex - width, endIndex: newEndIndex });
  };

  const handleResetZoom = () => setVisibleRange({ startIndex: 0, endIndex: priceData.length });
  
  const visibleData = priceData.slice(visibleRange.startIndex, visibleRange.endIndex);
  const combinedVisibleData = visibleData.map((point) => {
    const compPoint = comparisonData?.find(c => c.date === point.date);
    return { ...point, comparisonClose: compPoint?.close };
  });

  const comparisonLabel = COMPARISON_OPTIONS.find(opt => opt.value === comparisonOption)?.label;

  return (
    <div className="min-h-screen bg-light-secondary text-gray-800 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader
          priceInfo={currentPriceInfo}
          isLoading={isLoading}
          onRefresh={handleRefresh}
        />
        <main className="mt-6">
          <div className="bg-light-primary rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
               <div className="flex flex-wrap items-center gap-3">
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
                canZoomIn={visibleRange.endIndex - visibleRange.startIndex > MIN_CANDLES_VISIBLE}
                canZoomOut={visibleRange.startIndex > 0 || visibleRange.endIndex < priceData.length}
                canPanLeft={visibleRange.startIndex > 0}
                canPanRight={visibleRange.endIndex < priceData.length}
              />
            </div>

            <div className="h-[500px] relative mb-6">
              {(isLoading || isComparisonLoading) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue mb-4"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Fetching live market data via Google Search...</p>
                </div>
              )}
              {error && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-red-50 rounded-lg">
                  <svg className="h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-red-600 font-semibold">{error}</p>
                  <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Try Again</button>
                </div>
              )}
              {!isLoading && !error && combinedVisibleData.length > 0 && (
                <PriceChart 
                  data={combinedVisibleData} 
                  comparisonLabel={comparisonOption !== 'NONE' ? comparisonLabel : null}
                />
              )}
            </div>

            {sources.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Verified Sources (via Google Search)</h3>
                <div className="flex flex-wrap gap-3">
                  {sources.map((source, i) => (
                    <a 
                      key={i} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-200 rounded-full text-xs text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      {source.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        <footer className="text-center text-gray-400 mt-8 text-xs">
          <p>FCPO Futures Price Tracker | Real-time grounding powered by Gemini & Google Search.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
