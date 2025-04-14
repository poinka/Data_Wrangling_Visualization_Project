/**
 * Визуализация трендов в кино
 * Основной JavaScript файл
 */

// Ждем загрузки DOM перед выполнением скриптов
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем анимации
    startAnimations();
    
    // Добавляем обработчик прокрутки для анимаций при скролле
    window.addEventListener('scroll', handleScroll);
    
    // Инициализируем физику
    initPhysics();

    // Инициализируем графики
    initCharts();

    // Инициализируем анимацию счетчика
    initNumberAnimation();
});

/**
 * Запускает начальные анимации элементов
 */
function startAnimations() {
    // Remove title and description animations
    // The code below replaces the previous animation code for these elements
    
    // Анимируем блок методологии при появлении в поле зрения
    const methodSection = document.querySelector('.method-content');
    methodSection.style.animation = 'fadeIn 1.5s forwards 1s';
    
    // Настраиваем начальное состояние статистики для последующей анимации
    const statsHeader = document.querySelector('.stats-header');
    statsHeader.style.animation = 'fadeIn 1.5s forwards 1s';
}

/**
 * Обрабатывает события прокрутки страницы
 */
function handleScroll() {
    // Анимируем элементы методологии при прокрутке
    animateOnScroll('.method-item', 'slideInLeft', 150);
    animateOnScroll('.scrap-text', 'slideInLeft', 0);
    
    // Анимируем кружки в секции статистики
    animateOnScroll('.circle', 'growCircle', 300);
    
    // Анимируем столбцы диаграммы
    animateChartBars();
    
    // Анимируем секцию временного интервала
    animateQuasarEffect();
    
    // Анимируем фильтры с эффектом зачеркивания
    animateFilters();
    
    // Add visualization sections animation
    const vizSections = document.querySelectorAll('.visualization-section');
    vizSections.forEach(section => {
        if (isInViewport(section) && !section.classList.contains('animated')) {
            section.classList.add('animated');
            const chart = section.querySelector('canvas');
            if (chart) {
                chart.style.opacity = '0';
                setTimeout(() => {
                    chart.style.transition = 'opacity 0.8s ease';
                    chart.style.opacity = '1';
                }, 300);
            }
            
            const insight = section.querySelector('.insight-box');
            if (insight) {
                insight.style.opacity = '0';
                insight.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    insight.style.transition = 'all 0.8s ease';
                    insight.style.opacity = '1';
                    insight.style.transform = 'translateY(0)';
                }, 600);
            }
        }
    });
}

/**
 * Анимирует эффект квазара при прокрутке
 */
function animateQuasarEffect() {
    const yearsContainer = document.querySelector('.years-container');
    const staticLine = document.getElementById('static-line');
    const rotatingLine = document.getElementById('rotating-line');
    const quasarFill = document.getElementById('quasar-fill');
    const quasarMaskPath = document.getElementById('quasar-mask-path');
    
    if (isInViewport(yearsContainer) && !yearsContainer.classList.contains('animated')) {
        // Добавляем класс для запуска CSS-анимаций
        yearsContainer.classList.add('animated');
        
        // Начальное положение линий
        const startY = 250;
        const svgWidth = 1000;
        
        // Initial state - both lines horizontal
        let currentAngle = 0;
        const targetAngle = 40; // Maximum rotation angle
        const duration = 1000; // Animation duration in ms
        const startTime = Date.now();
        
        // Функция обновления заливки между линиями
        function updateQuasarFill() {
            // Calculate progress (0 to 1)
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Calculate current angle based on progress (easing function)
            const easedProgress = easeOutQuad(progress);
            currentAngle = easedProgress * targetAngle;
            
            // If animation is complete, stop requesting frames
            if (progress >= 1) {
                // Set final state and don't request another frame
                const finalAngle = targetAngle;
                const rotatingYLeft = startY + svgWidth * Math.tan(finalAngle * Math.PI / 180) / 2;
                const rotatingYRight = startY - svgWidth * Math.tan(finalAngle * Math.PI / 180) / 2;
                updateQuasarPath(startY, rotatingYLeft, rotatingYRight, svgWidth);
                return;
            }
            
            // Calculate y-positions based on angle - REVERSED DIRECTION
            const rotatingYLeft = startY + svgWidth * Math.tan(currentAngle * Math.PI / 180) / 2;
            const rotatingYRight = startY - svgWidth * Math.tan(currentAngle * Math.PI / 180) / 2;
            
            // Update path connections
            updateQuasarPath(startY, rotatingYLeft, rotatingYRight, svgWidth);
            
            // Continue animation until complete
            requestAnimationFrame(updateQuasarFill);
        }
        
        // Helper function to update path
        function updateQuasarPath(staticY, rotatingYLeft, rotatingYRight, width) {
            // Update rotating line position - left endpoint down, right endpoint up
            rotatingLine.setAttribute('y1', rotatingYLeft);
            rotatingLine.setAttribute('y2', rotatingYRight);
            
            // Create a proper closed polygon path
            const pathData = `M0,${rotatingYLeft} L${width},${rotatingYRight} L${width},${staticY} L0,${staticY} Z`;
            
            // Update both the fill and mask
            quasarFill.setAttribute('d', pathData);
            if (quasarMaskPath) {
                quasarMaskPath.setAttribute('d', pathData);
            }
        }
        
        // Easing function for smoother animation
        function easeOutQuad(t) {
            return t * (2 - t);
        }
        
        // Запускаем анимацию
        updateQuasarFill();
    }
}

/**
 * Анимирует элементы при их появлении в поле зрения
 * @param {string} selector - CSS селектор элементов
 * @param {string} animationName - Название анимации из CSS
 * @param {number} stagger - Задержка между анимациями последовательных элементов (мс)
 * @param {Function} callback - Callback function to run after animation is applied
 */
function animateOnScroll(selector, animationName, stagger = 0, callback = null) {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((element, index) => {
        if (isInViewport(element) && !element.classList.contains('animated')) {
            setTimeout(() => {
                element.style.animation = `${animationName} 1s forwards`;
                element.classList.add('animated');
                
                // Run callback if provided
                if (callback && index === 0) { // Only for first element
                    callback();
                }
            }, index * stagger);
        }
    });
}

/**
 * Анимирует столбцы диаграммы
 */
function animateChartBars() {
    const chartContainer = document.querySelector('.chart-container');
    if (!isInViewport(chartContainer)) return;
    
    const bars = document.querySelectorAll('.bar');
    
    bars.forEach((bar, index) => {
        if (!bar.classList.contains('animated')) {
            // Получаем целевую высоту из стилей
            const targetHeight = bar.style.height;
            
            // Устанавливаем переменную CSS для анимации
            bar.style.setProperty('--final-height', targetHeight);
            
            // Запускаем анимацию с задержкой
            setTimeout(() => {
                bar.style.animation = 'growBar 1.5s forwards';
                bar.classList.add('animated');
            }, index * 100);
        }
    });
}

/**
 * Анимирует зачеркивание фильтров при прокрутке
 */
function animateFilters() {
    const filterItems = document.querySelectorAll('.filter-item');
    
    filterItems.forEach((item, index) => {
        // Check if element is in viewport and not yet animated
        if (isInViewport(item) && !item.classList.contains('animated')) {
            // Add a delay between each filter animation
            setTimeout(() => {
                item.classList.add('animated');
            }, index * 300); // 300ms delay between each item
        }
    });
}

/**
 * Проверяет, находится ли элемент в поле зрения
 * @param {Element} element - DOM элемент для проверки
 * @returns {boolean} - true, если элемент виден
 */
function isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    
    // Consider element in viewport if its top is in the bottom 80% of the screen
    // or if its bottom is in the top 80% of the screen
    return (
        (rect.top >= 0 && rect.top <= windowHeight * 0.8) ||
        (rect.bottom >= windowHeight * 0.2 && rect.bottom <= windowHeight)
    );
}

function initPhysics() {
    const Engine = Matter.Engine,
        Render = Matter.Render,
        World = Matter.World,
        Bodies = Matter.Bodies,
        Constraint = Matter.Constraint,
        Body = Matter.Body,
        Events = Matter.Events;

    const container = document.getElementById('physics-container');
    const containerRect = container.getBoundingClientRect();

    // Create engine with zero gravity 
    const engine = Engine.create({
        gravity: { x: 0, y: 0 }
    });

    // Create renderer
    const render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: containerRect.width,
            height: containerRect.height,
            wireframes: false,
            background: 'transparent'
        }
    });

    // Calculate positions in an equilateral triangle around center
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;
    const radii = [200, 160, 240]; // Original sizes from previous working version
    const triangleRadius = 150; // Original distance
    const angleStep = (Math.PI * 2) / 3;
    
    // Original positions array structure
    const positions = [
        { 
            x: centerX + Math.cos(0) * triangleRadius, 
            y: centerY + Math.sin(0) * triangleRadius - 40 // Move top circle higher (original offset)
        },
        { 
            x: centerX + Math.cos(angleStep) * triangleRadius, 
            y: centerY + Math.sin(angleStep) * triangleRadius
        },
        { 
            x: centerX + Math.cos(angleStep * 2) * triangleRadius, 
            y: centerY + Math.sin(angleStep * 2) * triangleRadius
        }
    ];

    const bodies = [];
    const circleElements = document.querySelectorAll('.circle-item');
    // Original element order mapping
    const circleOrder = [circleElements[1], circleElements[2], circleElements[0]];

    positions.forEach((pos, i) => {
        const radius = radii[i];
        const element = circleOrder[i]; // Get element based on original mapping
        const body = Bodies.circle(
            pos.x, pos.y, radius,
            {
                restitution: 0.5,
                friction: 0.1,
                density: 0.01,
                frictionAir: 0.05,
                element: element // Assign DOM element reference
            }
        );
        
        body.element = element;
        body.circleRadius = radius;
        body.originalPosition = { x: pos.x, y: pos.y };
        
        bodies.push(body);
    });

    // Create constraints to pull towards original positions
    const centerConstraints = bodies.map(body => 
        Constraint.create({
            bodyA: body,
            pointB: { x: body.originalPosition.x, y: body.originalPosition.y },
            stiffness: 0.001,
            damping: 0.5,
            render: { visible: false }
        })
    );
    
    // Create triangle constraints between circles (original logic)
    const triangleConstraints = [
        Constraint.create({
            bodyA: bodies[0],
            bodyB: bodies[1],
            length: bodies[0].circleRadius + bodies[1].circleRadius, 
            stiffness: 0.005, damping: 0.2, render: { visible: false }
        }),
        Constraint.create({
            bodyA: bodies[1],
            bodyB: bodies[2],
            length: bodies[1].circleRadius + bodies[2].circleRadius, 
            stiffness: 0.005, damping: 0.2, render: { visible: false }
        }),
        Constraint.create({
            bodyA: bodies[2],
            bodyB: bodies[0],
            length: bodies[2].circleRadius + bodies[0].circleRadius, 
            stiffness: 0.005, damping: 0.2, render: { visible: false }
        })
    ];

    // Add all elements to world
    World.add(engine.world, [...bodies, ...centerConstraints, ...triangleConstraints]);

    // Run the engine
    Engine.run(engine);
    Render.run(render);

    // Make the canvas pointer events none so DOM events work
    render.canvas.style.pointerEvents = 'none';

    // Add original hover and drag behavior
    circleOrder.forEach((circle, i) => {
        const body = bodies[i];
        circle.style.transformOrigin = 'center center';
        
        // Add custom hover effect
        circle.addEventListener('mouseenter', () => {
            circle.style.transform = `translate(var(--x), var(--y)) scale(1.05)`;
        });
        
        circle.addEventListener('mouseleave', () => {
            circle.style.transform = `translate(var(--x), var(--y))`;
        });
        
        // Add drag with limited movement (original logic)
        circle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startPosX = body.position.x;
            const startPosY = body.position.y;
            const maxDragDistance = 100; // Original max drag distance
            
            const moveHandler = (moveEvent) => {
                let deltaX = moveEvent.clientX - startX;
                let deltaY = moveEvent.clientY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                if (distance > maxDragDistance) {
                    const ratio = maxDragDistance / distance;
                    deltaX *= ratio;
                    deltaY *= ratio;
                }
                Body.setPosition(body, { x: startPosX + deltaX, y: startPosY + deltaY });
            };
            
            const upHandler = () => {
                document.removeEventListener('mousemove', moveHandler);
                document.removeEventListener('mouseup', upHandler);
            };
            
            document.addEventListener('mousemove', moveHandler);
            document.addEventListener('mouseup', upHandler);
        });
    });

    // Sync DOM elements with physics world positions
    function updateCircles() {
        bodies.forEach((body, i) => {
            const element = body.element;
            const radius = body.circleRadius;
            const x = body.position.x - radius;
            const y = body.position.y - radius;
            element.style.setProperty('--x', `${x}px`);
            element.style.setProperty('--y', `${y}px`);
            element.style.width = `${radius * 2}px`;
            element.style.height = `${radius * 2}px`;
            // Keep hover scale logic separate
             if (!element.style.transform.includes('scale')) {
                 element.style.transform = `translate(${x}px, ${y}px)`;
             } else {
                 // If scale is applied (hover), maintain it
                 element.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
             }
        });
        requestAnimationFrame(updateCircles);
    }
    updateCircles();
}

function initCharts() {
    // Define a modern color palette
    const colors = {
        primary: '#08D9D6',    // Teal/Cyan
        secondary: '#FF2E63',  // Magenta/Pink
        tertiary: '#FCE38A',   // Yellow
        accent: '#95E1D3',    // Light Teal
        text: '#EAEAEA',      // Light Gray
        grid: 'rgba(0, 0, 0, 0)', // Transparent grid lines (removed)
        background: 'rgba(0, 0, 0, 0)', // Fully transparent background
        scatter1: '#FF2E63', // Magenta/Pink
        scatter2: '#FCE38A', // Yellow
        scatter3: '#08D9D6'  // Teal/Cyan
    };

    // Chart configurations with larger text
    const chartConfigs = {
        genreChart: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average Box Office (Millions $)',
                    data: [],
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                    borderWidth: 1
                }]
            },
            options: {
                animation: {
                    duration: 1500,
                    easing: 'easeOutCubic'
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    onHover: (event, chartElement) => {
                        const canvas = event.native.target; // Get the canvas element
                        if (chartElement.length) {
                            canvas.style.cursor = 'pointer'; // Change cursor to pointer when hovering over legend
                        } else {
                            canvas.style.cursor = 'default'; // Reset cursor when not hovering over legend
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        // Revert Y-axis grid to use transparent color, like other working charts
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    x: {
                        grid: { display: false }, // Keep X grid hidden
                        ticks: { color: colors.text, font: { size: 16 } } // Larger text
                    }
                }
            }
        },
        decadeChart: {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Average rating',
                    data: [],
                    borderColor: colors.secondary,
                    backgroundColor: 'rgba(255, 46, 99, 0.2)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: colors.secondary
                }]
            },
            options: {
                animation: {
                    duration: 1500,
                    easing: 'easeOutCubic'
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    onHover: (event, chartElement) => {
                        const canvas = event.native.target; // Get the canvas element
                        if (chartElement.length) {
                            canvas.style.cursor = 'pointer'; // Change cursor to pointer when hovering over legend
                        } else {
                            canvas.style.cursor = 'default'; // Reset cursor when not hovering over legend
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text, font: { size: 16 } } // Larger text
                    }
                }
            }
        },
        actorChart: {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Total Box Office (Billions $)',
                    data: [],
                    backgroundColor: colors.tertiary,
                    borderColor: colors.tertiary,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                animation: {
                    duration: 1500,
                    easing: 'easeOutCubic'
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    onHover: (event, chartElement) => {
                        const canvas = event.native.target; // Get the canvas element
                        if (chartElement.length) {
                            canvas.style.cursor = 'pointer'; // Change cursor to pointer when hovering over legend
                        } else {
                            canvas.style.cursor = 'default'; // Reset cursor when not hovering over legend
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { display: false },
                        ticks: { color: colors.text, font: { size: 16, weight: 'bold' } } // Larger text
                    },
                    x: {
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } } // Larger text
                    }
                }
            }
        },
        budgetBoxOfficeChart: {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Box Office < Budget',
                        data: [],
                        backgroundColor: colors.scatter1,
                        pointRadius: 6
                    },
                    {
                        label: 'Budget ≤ Box Office < 2x Budget',
                        data: [],
                        backgroundColor: colors.scatter2,
                        pointRadius: 6
                    },
                    {
                        label: 'Box Office ≥ 2x Budget',
                        data: [],
                        backgroundColor: colors.scatter3,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                animation: {
                    duration: 1500,
                    easing: 'easeOutCubic'
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += `Budget: $${context.raw.x.toFixed(2)}M, Box Office: $${context.raw.y.toFixed(2)}M`;
                                return label;
                            }
                        }
                    },
                    onHover: (event, chartElement) => {
                        const canvas = event.native.target; // Get the canvas element
                        if (chartElement.length) {
                            canvas.style.cursor = 'pointer'; // Change cursor to pointer when hovering over legend
                        } else {
                            canvas.style.cursor = 'default'; // Reset cursor when not hovering over legend
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Production Budget ($M)',
                            color: colors.text,
                            font: { size: 16 }
                        },
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } },
                        min: 1
                    },
                    y: {
                        type: 'logarithmic',
                        title: {
                            display: true,
                            text: 'Box Office ($M)',
                            color: colors.text,
                            font: { size: 16 }
                        },
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } },
                        min: 1
                    }
                }
            }
        },
        imdbMetascoreChart: {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Box Office < Budget',
                        data: [],
                        backgroundColor: colors.scatter1,
                        pointRadius: 6
                    },
                    {
                        label: 'Budget ≤ Box Office < 2x Budget',
                        data: [],
                        backgroundColor: colors.scatter2,
                        pointRadius: 6
                    },
                    {
                        label: 'Box Office ≥ 2x Budget',
                        data: [],
                        backgroundColor: colors.scatter3,
                        pointRadius: 6
                    }
                ]
            },
            options: {
                animation: {
                    duration: 1500,
                    easing: 'easeOutCubic'
                },
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: colors.text, font: { size: 16 } } // Larger text
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += `IMDb: ${context.raw.x.toFixed(1)}, Metascore: ${context.raw.y}`;
                                return label;
                            }
                        }
                    },
                    onHover: (event, chartElement) => {
                        const canvas = event.native.target; // Get the canvas element
                        if (chartElement.length) {
                            canvas.style.cursor = 'pointer'; // Change cursor to pointer when hovering over legend
                        } else {
                            canvas.style.cursor = 'default'; // Reset cursor when not hovering over legend
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'IMDb Score',
                            color: colors.text,
                            font: { size: 16 }
                        },
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } },
                        min: 0,
                        max: 10
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Metascore',
                            color: colors.text,
                            font: { size: 16 }
                        },
                        grid: { color: colors.grid },
                        ticks: { color: colors.text, font: { size: 16 } },
                        min: 0,
                        max: 100
                    }
                }
            }
        }
    };

    // Function to fetch data and initialize a chart
    const initializeChart = (chartId, apiEndpoint, chartType = 'chartjs') => {
        if (chartType === 'd3') {
            return fetch(apiEndpoint)
                .then(response => response.json())
                .then(data => {
                    // Convert data to D3 format: [{ label, value }, ...]
                    let chartData = data.labels.map((label, index) => ({
                        label,
                        value: data.data[index]
                    }));
                    
                    console.log("Creating D3 decade chart with data:", chartData);
                    const chartInstance = createDecadeLineChart(chartData);
                    return chartInstance; // Return the chart instance for animation
                    
                })
                .catch(error => {
                    console.error(`Error fetching/rendering data for ${chartId}:`, error);
                    throw error; // Ensure errors are propagated
                });
        } else {
            // Wrap Chart.js logic in a Promise
            return new Promise((resolve, reject) => {
                fetch(apiEndpoint)
                    .then(response => response.json())
                    .then(data => {
                        const config = chartConfigs[chartId];
                        if (!config) {
                            console.warn(`No config found for chartId: ${chartId}`);
                            resolve(null); // Resolve with null to indicate no chart instance
                            return;
                        }
                        if (chartId === 'budgetBoxOfficeChart' || chartId === 'imdbMetascoreChart') {
                            config.data.datasets.forEach((dataset, index) => {
                                if (data[index] && data[index].data) {
                                    dataset.data = data[index].data;
                                } else {
                                    console.warn(`Missing data for dataset index ${index} in ${chartId}`);
                                }
                            });
                        } else {
                            if (data.labels && data.data) {
                                config.data.labels = data.labels;
                                config.data.datasets[0].data = data.data;
                            } else {
                                console.warn(`Missing labels or data for ${chartId}`);
                            }
                        }
                        const canvas = document.getElementById(chartId);
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            if (canvas.chartInstance) {
                                canvas.chartInstance.destroy();
                            }
                            canvas.chartInstance = new Chart(ctx, config);
                            resolve(canvas.chartInstance); // Resolve with the Chart.js instance
                        } else {
                            console.warn(`Canvas element not found for ${chartId}`);
                            resolve(null); // Resolve with null if canvas not found
                        }
                    })
                    .catch(error => {
                        console.error(`Error fetching/rendering data for ${chartId}:`, error);
                        reject(error); // Reject the Promise on error
                    });
            });
        }
    };

    // Initialize charts when they become visible
    const observerCallback = (entries, observer) => {
        const chartInstances = {}; // Store chart instances for animation
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const chartId = entry.target.id;
                let apiEndpoint;
                let chartType = 'chartjs';
                switch (chartId) {
                    case 'genreChart':
                        apiEndpoint = '/api/genres';
                        break;
                    case 'decadeChart':
                        apiEndpoint = '/api/decade_hits';
                        chartType = 'd3';
                        break;
                    case 'actorChart':
                        apiEndpoint = '/api/actors';
                        break;
                    case 'budgetBoxOfficeChart':
                        apiEndpoint = '/api/budget_box_office';
                        break;
                    case 'imdbMetascoreChart':
                        apiEndpoint = '/api/imdb_metascore';
                        break;
                    default:
                        return;
                }
                if (apiEndpoint) {
                    initializeChart(chartId, apiEndpoint, chartType)
                        .then(chartInstance => {
                            if (chartInstance && chartInstance.animate) {
                                chartInstances[chartId] = chartInstance;
                                chartInstance.animate(); // Trigger the animation for D3 charts
                            }
                        })
                        .catch(error => {
                            console.error(`Error in observerCallback for ${chartId}:`, error);
                        });
                    observer.unobserve(entry.target); // Prevent multiple initializations
                }
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, {
        threshold: 0.1 // Trigger when 10% visible
    });

    // Observe each chart canvas
    Object.keys(chartConfigs).forEach(chartId => {
        const element = document.getElementById(chartId);
        if (element) {
            observer.observe(element);
        }
    });

    // Explicitly observe the decadeChart container
    const decadeChartContainer = document.getElementById('decadeChart');
    if (decadeChartContainer) {
        observer.observe(decadeChartContainer);
    }

    // Add resize listener specifically for Plotly charts that might need it
    window.addEventListener('resize', () => {
        const plotlyCharts = ['radarChart', 'imdbTrendChart', 'stackedRatingChart'];
        plotlyCharts.forEach(chartId => {
            const chartElement = document.getElementById(chartId);
            // Check if the element exists and is a Plotly plot
            if (chartElement && chartElement.classList.contains('js-plotly-plot')) {
                // Specifically for radarChart, forcefully remove inline height/width before resizing
                if (chartId === 'radarChart') {
                    const innerPlotlyContainer = chartElement.querySelector('div.user-select-none.svg-container');
                    if (innerPlotlyContainer) {
                        innerPlotlyContainer.style.height = null;
                        innerPlotlyContainer.style.width = null;
                    }
                }

                try {
                    Plotly.Plots.resize(chartElement);
                } catch (e) {
                    console.error(`Error resizing Plotly chart ${chartId}:`, e);
                }
            }
        });
    });
}

// Update Plotly fetches with new colors and transitions
fetch("/api/stacked_avg_ratings")
    .then(response => response.json())
    .then(chartData => {
        // Define Plotly layout with transitions and updated colors
        const layout = {
            ...chartData.layout, // Keep original layout structure
            plot_bgcolor: '#000000', // Black background
            paper_bgcolor: '#000000', // Black background
            font: { color: '#EAEAEA', size: 16 }, // Larger font size
            legend: { font: { size: 18 } }, // Larger legend
            xaxis: { 
                ...chartData.layout.xaxis,
                gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                showline: false, // Hide the axis line itself
                tickfont: { size: 16 } // Larger axis ticks
            },
            yaxis: {
                ...chartData.layout.yaxis,
                gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                showline: false, // Hide the axis line itself
                tickfont: { size: 16 } // Larger axis ticks
            },
            transition: { // Add transition for smooth updates
                duration: 1000,
                easing: 'cubic-in-out'
            },
            margin: { l: 60, r: 20, t: 40, b: 60 } // Adjust margins if needed
        };
        
        // Make lines and markers thicker
        chartData.data.forEach(trace => {
            if (trace.line) trace.line.width = 6; // Extra thick lines
            if (trace.marker) {
                trace.marker.size = 14; // Extra large markers
                if (trace.marker.line) trace.marker.line.width = 3; // Thicker marker borders
            }
        });

        // Override colors
        if (chartData.data[0]) chartData.data[0].marker.color = '#08D9D6'; // Teal
        if (chartData.data[1]) chartData.data[1].marker.color = '#FF2E63'; // Magenta

        Plotly.newPlot("stackedRatingChart", chartData.data, layout, {responsive: true, displayModeBar: false});
    })
    .catch(error => console.error('Error fetching/rendering stackedRatingChart:', error));

fetch("/api/radar_chart")
    .then(response => response.json())
    .then(chartData => {
        // Define Plotly layout with transitions and updated colors
        const layout = {
            ...chartData.layout,
            polar: {
                ...chartData.layout.polar,
                bgcolor: '#000000', // Black background
                angularaxis: {
                    ...chartData.layout.polar.angularaxis,
                    linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                    gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                    tickfont: { size: 16 }, // Larger axis ticks
                    showgrid: false, // Remove grid completely
                    showticklabels: true, // Keep tick labels
                    gridcolor: 'rgba(0, 0, 0, 0)', // Ensure grid is transparent
                },
                radialaxis: {
                    ...chartData.layout.polar.radialaxis,
                    linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                    gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                    showgrid: false, // Remove grid completely
                    showline: true, // Show axis line
                    tickfont: { color: '#EAEAEA', size: 16 } // Larger axis ticks
                }
            },
            paper_bgcolor: '#000000', // Black background
            plot_bgcolor: '#000000', // Ensure plot background is black
            font: { color: '#EAEAEA', size: 16 }, // Larger font size
            legend: { font: { size: 18 } }, // Larger legend
            transition: { // Add improved transition
                duration: 1500,
                easing: 'cubic-in-out'
            },
            autosize: false, // Disable autosize since we're setting explicit dimensions
            height: 800, // Set VERY LARGE fixed height - this is the key change
            width: 1000,  // Set VERY LARGE fixed width
            margin: { 
                l: 120, // Larger left margin 
                r: 200, // Much larger right margin to prevent legend trimming
                t: 60,  // Keep top margin the same
                b: 60,  // Keep bottom margin the same
                autoexpand: true // Enable auto-expansion of margins to fit legend
            }
        };

        // Make lines and markers thicker
        chartData.data.forEach(trace => {
            if (!trace.marker) trace.marker = {}; // Ensure marker object exists
            if (!trace.line) trace.line = {}; // Ensure line object exists
            
            trace.line.width = 6; // Extra thick lines
            trace.marker.size = 14; // Extra large markers
        });
        
        // Override trace colors if needed, ensuring objects exist
        if (chartData.data[0]) {
            chartData.data[0].marker.color = 'rgba(8, 217, 214, 0.7)'; 
            chartData.data[0].line.color = '#08D9D6';
        }
        if (chartData.data[1]) {
            chartData.data[1].marker.color = 'rgba(255, 46, 99, 0.7)'; 
            chartData.data[1].line.color = '#FF2E63';
        }

        Plotly.newPlot("radarChart", chartData.data, layout, {responsive: true, displayModeBar: false});
        
        // Direct DOM manipulation to center the radar chart after it's created
        setTimeout(() => {
            const radarChart = document.getElementById('radarChart');
            if (radarChart) {
                // Make the parent container a flex container
                radarChart.style.display = 'flex';
                radarChart.style.justifyContent = 'center';
                radarChart.style.alignItems = 'center';
                
                // Find the SVG container and force center it
                const svgContainer = radarChart.querySelector('.svg-container');
                if (svgContainer) {
                    svgContainer.style.margin = '0 auto';
                    svgContainer.style.left = '0';
                    svgContainer.style.position = 'relative';
                }
            }
        }, 100); // Small delay to ensure the chart is fully rendered
    })
    .catch(error => console.error('Error fetching/rendering radarChart:', error));

async function renderImdbTrendChart() {
    try {
        const response = await fetch('/api/imdb_trends');
        const data = await response.json();

        const periods = data.map(d => d.period);
        const high = data.map(d => d.high_pct);
        const mid = data.map(d => d.mid_pct);
        const low = data.map(d => d.low_pct);

        // Updated trace colors and sizes
        const traceHigh = {
            x: periods,
            y: high,
            mode: 'lines+markers',
            name: '> 7.0',
            line: { color: '#08D9D6', width: 6 }, // Teal, extra thick line
            marker: { color: '#08D9D6', size: 14 } // Extra large markers
        };

        const traceMid = {
            x: periods,
            y: mid,
            mode: 'lines+markers',
            name: '6.0 – 7.0',
            line: { color: '#FCE38A', width: 6 }, // Yellow, extra thick line
            marker: { color: '#FCE38A', size: 14 } // Extra large markers
        };

        const traceLow = {
            x: periods,
            y: low,
            mode: 'lines+markers',
            name: '< 6.0',
            line: { color: '#FF2E63', width: 6 }, // Magenta, extra thick line
            marker: { color: '#FF2E63', size: 14 } // Extra large markers
        };

        // Updated layout with transitions and colors
        const layout = {
            title: ' ',
            xaxis: { 
                title: 'Year (5-year groups)', 
                color: '#EAEAEA',
                gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                showline: false, // Hide the axis line itself
                zerolinecolor: 'rgba(234, 234, 234, 0.9)', // More visible zero line
                tickfont: { size: 16 } // Larger axis ticks
            },
            yaxis: { 
                title: 'Percentage of Films', 
                color: '#EAEAEA',
                gridcolor: 'rgba(0, 0, 0, 0)', // Transparent grid (removed)
                linecolor: 'rgba(234, 234, 234, 0.9)', // More visible axis lines
                showline: false, // Hide the axis line itself
                zerolinecolor: 'rgba(234, 234, 234, 0.9)', // More visible zero line
                tickfont: { size: 16 } // Larger axis ticks
            },
            plot_bgcolor: '#000000', // Black background
            paper_bgcolor: '#000000', // Black background
            font: { color: '#EAEAEA', size: 16 }, // Larger font size
            legend: { font: { size: 18 } }, // Larger legend
            transition: { // Add transition
                duration: 1000,
                easing: 'cubic-in-out'
            },
            margin: { l: 60, r: 20, t: 40, b: 60 }
        };

        Plotly.newPlot('imdbTrendChart', [traceHigh, traceMid, traceLow], layout, {responsive: true, displayModeBar: false});
    } catch (error) {
        console.error("Error rendering IMDb trend chart:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    renderImdbTrendChart();
});

/**
 * Инициализирует анимацию счетчика для числа 4000
 */
function initNumberAnimation() {
    const numberElement = document.querySelector('.stats-number');
    if (!numberElement) return;

    const targetNumber = 4000;
    const startNumber = 1000;
    const duration = 2000; // 2 seconds
    let animationStarted = false;

    const animateCount = (timestamp) => {
        let startTime = null;
        const step = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentNumber = Math.floor(progress * (targetNumber - startNumber) + startNumber);
            numberElement.textContent = currentNumber.toLocaleString(); // Format number if needed

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                numberElement.textContent = targetNumber.toLocaleString(); // Ensure final number is exact
            }
        };
        requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animationStarted) {
                animationStarted = true;
                numberElement.textContent = startNumber.toLocaleString(); // Start from 1000
                animateCount();
                observer.unobserve(numberElement); // Stop observing once animated
            }
        });
    }, {
        threshold: 0.5 // Trigger when 50% of the element is visible
    });

    observer.observe(numberElement);
}

function createDecadeLineChart(data) {
    // Dynamically set width based on the container's width (full page width)
    const container = d3.select("#decadeChart");
    const containerWidth = container.node().getBoundingClientRect().width; // Get the container's width
    const margin = { top: 30, right: 60, bottom: 20, left: 60 };
    const width = containerWidth - margin.left - margin.right; // Scale to container width
    const height = 500 - margin.top - margin.bottom;

    // Center the SVG by ensuring the container is styled for centering
    container.style("display", "flex").style("justify-content", "center");

    // Clear previous SVG to avoid duplicates
    container.select("svg").remove();

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define scales
        const x = d3.scalePoint()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.05);

        const y = d3.scaleLinear()
            .domain([6.40, 6.85])
            .range([height, 0]);

        // Define the line
        const line = d3.line()
            .x(d => x(d.label)) // Center the points on the x-axis
            .y(d => y(d.value))
            .curve(d3.curveCatmullRom);

        // Create a clip-path to control the visible height
        svg.append("defs")
        .append("clipPath")
        .attr("id", "clip-decade-chart")
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", 0); // Start with height 0

        // Apply the clip-path to the plot elements
        const plotGroup = svg.append("g")
            .attr("clip-path", "url(#clip-decade-chart)");

        // Draw the filled area beneath the curve
        plotGroup.append("path")
        .datum(data)
        .attr("fill", "darkred")
        .attr("opacity", 0.5)
        .attr("d", d3.area()
            .x(d => x(d.label)) // Center the points on the x-axis
            .y0(height)
            .y1(d => y(d.value))
            .curve(d3.curveCatmullRom)
        );
        // Draw the line
        plotGroup.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", "#FF2E63")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add points for each decade
        plotGroup.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "point")
        .attr("cx", d => x(d.label))
        .attr("cy", d => y(d.value))
        .attr("r", 5) // Radius of the points
        .attr("fill", "#FF2E63"); // Match the curve color

        // Add x-axis (decades)
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).tickSize(0))
            .call(g => g.select(".domain").style("display", "none")) // Remove x-axis line
            .selectAll("text")
            .style("fill", "#EAEAEA")
            .style("font-size", "16px");

        // Add y-axis (ratings)
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(g => g.select(".domain").style("display", "none"))
            .selectAll("text")
            .style("fill", "#EAEAEA")
            .style("font-size", "16px");            

        // Add "Average rating" note
        svg.append("rect")
        .attr("x", width/2 - 50)
        .attr("y", 0)
        .attr("width", 50)
        .attr("height", 20)
        .attr("fill", "darkred")
        .attr("opacity", 0.5) // Semi-transparent like the area under the curve
        .attr("stroke", "#FF2E63") // Border color matches the curve
        .attr("stroke-width", 2)

        svg.append("text")
            .attr("x", width/2 + 50)
            .attr("y", 10)
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .style("fill", "white") 
            .style("font-size", "12px")
            .text("Average rating");
        
        // Add hover effect 
        plotGroup.selectAll(".point")
        .on("mouseover", function(event, d) {
            d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 10) // Increase radius on hover
            .attr("fill", "#FF2E63"); // Change color on hover

            // Show exact rating as a tooltip
            svg.append("text")
            .attr("class", "tooltip")
            .attr("x", d3.select(this).attr("cx"))
            .attr("y", d3.select(this).attr("cy") - 15) // Position above the point
            .attr("text-anchor", "middle")
            .style("fill", "#EAEAEA")
            .style("font-size", "12px")
            .text(d.value.toFixed(2)); // Display the exact rating
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
            .transition()
            .duration(200)
            .attr("r", 5) // Reset radius
            .attr("fill", "#FF2E63"); // Reset color

            // Remove the tooltip
            svg.selectAll(".tooltip").remove();
        });

        // Return the SVG and clip-path for animation
    return {
        svg: svg,
        animate: function() {
            svg.select("#clip-decade-chart rect")
                .transition()
                .duration(3000) // Animation duration in milliseconds
                .attr("height", height + margin.top + margin.bottom); // Expand to full height
        }
    };
}