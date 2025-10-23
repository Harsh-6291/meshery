import React, { useEffect, useRef } from 'react';
import { Box, styled, useTheme, NoSsr } from '@sistent/sistent';
import bb, { gauge } from 'billboard.js';

const ChartRoot = styled(Box)(() => ({
  width: '100%',
  height: '75%',
  minHeight: '18rem',
  '& .bb-chart-arcs-background': {
    fill: '#e0e0e0',
    stroke: 'none',
  },
}));

const ErrorMessage = styled(Box)(() => {
  const theme = useTheme();
  return {
    color: theme.palette.error.main,
    width: '100%',
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  };
});

export default function GrafanaCustomGaugeChart(props) {
  const chartRootRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const configChartData = () => {
    const { panel, data } = props;

    let units = '';
    if (panel?.format) {
      if (panel.format.startsWith('percent')) {
        units = '%';
      } else {
        units = ` ${panel.format}`;
      }
    }

    let min = 0;
    let max = 100;
    if (panel?.gauge) {
      if (panel.gauge.minValue) min = panel.gauge.minValue;
      if (panel.gauge.maxValue) max = panel.gauge.maxValue;
    }

    let colors = [];
    if (panel?.colors) {
      colors = panel.colors;
    }

    let thresholds = [];
    if (panel?.thresholds) {
      thresholds = panel.thresholds.split(',').map((t) => parseFloat(t.trim()));
    }

    let gdata = 0;
    let glabel = '';
    if (data && data.length > 0) {
      const dlind = data[0].length - 1;
      gdata = data[0][dlind] ? data[0][dlind] : 0;
      glabel = data[0][0];
    }

    if (chartRootRef.current) {
      // destroy previous chart if exists
      if (chartInstanceRef.current && typeof chartInstanceRef.current.destroy === 'function') {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }

      chartInstanceRef.current = bb.generate({
        bindto: chartRootRef.current,
        data: {
          columns: [[glabel, gdata]],
          type: gauge(),
        },
        gauge: {
          min,
          max,
          label: {
            format(value) {
              return value + units;
            },
            extents() {
              return '';
            },
          },
        },
        color: {
          pattern: colors,
          threshold: {
            values: thresholds,
          },
        },
        legend: { show: false },
        tooltip: { show: false },
      });
    }
  };

  // run when panel or data changes
  useEffect(() => {
    configChartData();
    // cleanup on unmount
    return () => {
      if (chartInstanceRef.current && typeof chartInstanceRef.current.destroy === 'function') {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [props.panel, props.data]);

  const { error } = props;

  return (
    <NoSsr>
      <Box>
        <ErrorMessage>{error && 'There was an error communicating with the server'}</ErrorMessage>
        <ChartRoot ref={chartRootRef} />
      </Box>
    </NoSsr>
  );
}