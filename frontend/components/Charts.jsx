import { useRef, useEffect, useMemo } from 'react'
import Chart from 'chart.js/auto'
import { formatLapTime } from '../utils/helpers'

const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 750 },
    plugins: {
        legend: { labels: { color: '#ffffff', font: { size: 12 } } },
        tooltip: {
            backgroundColor: '#03071E',
            titleColor: '#FFBA08',
            bodyColor: '#ffffff',
            borderColor: '#D00000',
            borderWidth: 2,
        }
    },
    scales: {
        x: { grid: { color: '#370617' }, ticks: { color: '#cccccc' } },
        y: { grid: { color: '#370617' }, ticks: { color: '#cccccc' } },
    }
}

export function PositionChart({ raceData, selectedDrivers }) {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    const datasets = useMemo(() => {
        if (!raceData || selectedDrivers.length === 0) return []
        return selectedDrivers.map((driverCode) => {
            const driverLaps = raceData.laps
                .filter(lap => lap.driver === driverCode && lap.position !== null)
                .sort((a, b) => a.lap_number - b.lap_number)
            if (driverLaps.length === 0) return null
            const driver = raceData.results.find(r => r.driver === driverCode)
            const color = driver ? driver.team_color : '#FFFFFF'
            return {
                label: driverCode,
                data: driverLaps.map(lap => ({ x: lap.lap_number, y: lap.position })),
                borderColor: color,
                backgroundColor: color + '40',
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
            }
        }).filter(Boolean)
    }, [raceData, selectedDrivers])

    useEffect(() => {
        if (!chartRef.current || datasets.length === 0) return
        if (chartInstance.current) chartInstance.current.destroy()
        chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
            type: 'line',
            data: { datasets },
            options: {
                ...CHART_OPTIONS,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Lap Number', color: '#cccccc', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' }, ticks: { color: '#cccccc' }
                    },
                    y: {
                        reverse: true,
                        title: { display: true, text: 'Position', color: '#cccccc', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' }, ticks: { color: '#cccccc', stepSize: 1 }
                    }
                }
            }
        })
        return () => chartInstance.current?.destroy()
    }, [datasets])

    return <div className="chart-container"><canvas ref={chartRef}></canvas></div>
}

export function LapTimeChart({ raceData, selectedDrivers }) {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    const datasets = useMemo(() => {
        if (!raceData || selectedDrivers.length === 0) return []
        return selectedDrivers.map((driverCode) => {
            const driverLaps = raceData.laps
                .filter(lap => lap.driver === driverCode && lap.lap_time !== null)
                .sort((a, b) => a.lap_number - b.lap_number)
            if (driverLaps.length === 0) return null
            const driver = raceData.results.find(r => r.driver === driverCode)
            const color = driver ? driver.team_color : '#FFFFFF'
            return {
                label: driverCode,
                data: driverLaps.map(lap => ({ x: lap.lap_number, y: lap.lap_time })),
                borderColor: color,
                backgroundColor: color + '40',
                borderWidth: 3,
                tension: 0.2,
                pointRadius: 2,
                pointHoverRadius: 6,
            }
        }).filter(Boolean)
    }, [raceData, selectedDrivers])

    useEffect(() => {
        if (!chartRef.current || datasets.length === 0) return
        if (chartInstance.current) chartInstance.current.destroy()
        chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
            type: 'line',
            data: { datasets },
            options: {
                ...CHART_OPTIONS,
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Lap Number', color: '#cccccc', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' }, ticks: { color: '#cccccc' }
                    },
                    y: {
                        title: { display: true, text: 'Lap Time', color: '#cccccc', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' },
                        ticks: { color: '#cccccc', callback: (v) => formatLapTime(v) }
                    }
                },
                plugins: {
                    ...CHART_OPTIONS.plugins,
                    tooltip: {
                        ...CHART_OPTIONS.plugins.tooltip,
                        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatLapTime(ctx.parsed.y)}` }
                    }
                }
            }
        })
        return () => chartInstance.current?.destroy()
    }, [datasets])

    return <div className="chart-container"><canvas ref={chartRef}></canvas></div>
}

export function TelemetryChart({ telemetryData }) {
    const chartRef = useRef(null)
    const chartInstance = useRef(null)

    useEffect(() => {
        if (!chartRef.current || !telemetryData?.length) return
        if (chartInstance.current) chartInstance.current.destroy()
        chartInstance.current = new Chart(chartRef.current.getContext('2d'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Speed (km/h)',
                        data: telemetryData.map(t => ({ x: t.distance, y: t.speed })),
                        borderColor: '#FFBA08',
                        backgroundColor: 'rgba(255,186,8,0.2)',
                        borderWidth: 2,
                        yAxisID: 'y',
                        pointRadius: 0,
                    },
                    {
                        label: 'Throttle (%)',
                        data: telemetryData.map(t => ({ x: t.distance, y: t.throttle })),
                        borderColor: '#00FF00',
                        backgroundColor: 'rgba(0,255,0,0.1)',
                        borderWidth: 2,
                        yAxisID: 'y1',
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                ...CHART_OPTIONS,
                animation: { duration: 500 },
                scales: {
                    x: {
                        type: 'linear',
                        title: { display: true, text: 'Distance (m)', color: '#cccccc', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' }, ticks: { color: '#cccccc' }
                    },
                    y: {
                        type: 'linear', position: 'left',
                        title: { display: true, text: 'Speed (km/h)', color: '#FFBA08', font: { size: 14, weight: 'bold' } },
                        grid: { color: '#370617' }, ticks: { color: '#FFBA08' }
                    },
                    y1: {
                        type: 'linear', position: 'right',
                        title: { display: true, text: 'Throttle (%)', color: '#00FF00', font: { size: 14, weight: 'bold' } },
                        grid: { display: false }, ticks: { color: '#00FF00' },
                        min: 0, max: 100
                    }
                }
            }
        })
        return () => chartInstance.current?.destroy()
    }, [telemetryData])

    return <div className="chart-container"><canvas ref={chartRef}></canvas></div>
}
