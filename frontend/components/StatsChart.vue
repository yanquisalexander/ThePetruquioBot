<template>
    <div class="chart-canvas-container">
        <canvas ref="chartCanvas" :height="height"></canvas>
    </div>
</template>

<script>
import { ref, watch } from 'vue';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);



export default {
    props: {
        chartData: Object,
        chartOptions: Object,
        chartType: {
            type: String,
            default: 'bar',
            enum: ['bar', 'line'],
        },
        height: {
            type: String,
            default: '300px'
        }
    },
    setup(props) {
        const chartCanvas = ref(null);
        let chartInstance = null;

        // Observa cambios en los datos del gráfico
        watch(() => props.chartData, (newData) => {
            if (chartInstance) {
                chartInstance.data = newData;
                chartInstance.update();
            }
        });

        const isMobile = () => {
            return window.innerWidth <= 768;
        };

        // Inicializa el gráfico cuando se monta el componente
        const initializeChart = () => {
            if (chartCanvas.value) {
                const ctx = chartCanvas.value.getContext('2d');
                chartInstance = new Chart(ctx, {
                    type: props.chartType || 'bar',
                    data: props.chartData,
                    options: {
                        ...props.chartOptions,
                        responsive: true,
                        maintainAspectRatio: false
                    }

                });


            }
        };

        return {
            chartCanvas,
            initializeChart,
        };
    },
    mounted() {
        this.initializeChart();
    },

};
</script>