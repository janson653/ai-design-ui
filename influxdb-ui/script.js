// InfluxDB Studio - Geek Edition JavaScript

class InfluxDBStudio {
    constructor() {
        this.connections = [];
        this.currentConnection = null;
        this.queryHistory = [];
        this.isConnected = false;
        this.influxClient = null;
        this.queryCache = new Map();
        this.realTimeQueries = new Map();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMockData();
        this.initializeUI();
    }

    setupEventListeners() {
        // 连接下拉菜单
        this.setupConnectionDropdown();

        // 新建连接按钮
        document.querySelector('.add-connection-btn').addEventListener('click', () => {
            this.showConnectionModal();
        });

        // 执行查询按钮
        document.querySelector('.execute-btn').addEventListener('click', () => {
            this.executeQuery();
        });

        // 刷新按钮
        document.querySelector('.refresh-btn').addEventListener('click', () => {
            this.refreshDatabaseTree();
        });

        // 树形结构展开/折叠
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('tree-toggle')) {
                this.toggleTreeNode(e.target);
            }
        });

        // 模态框事件
        this.setupModalEvents();

        // 键盘快捷键
        this.setupKeyboardShortcuts();

        // 窗口控制
        this.setupWindowControls();

        // 标签切换
        this.setupTabSwitching();

        // 搜索功能
        this.setupSearchFunctionality();
    }

    setupModalEvents() {
        const modal = document.getElementById('connectionModal');
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const overlay = modal.querySelector('.modal-overlay');

        [closeBtn, cancelBtn, overlay].forEach(element => {
            element.addEventListener('click', () => {
                this.hideConnectionModal();
            });
        });

        // 阻止模态框内容区域点击关闭
        modal.querySelector('.modal-content').addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter 执行查询
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.executeQuery();
            }

            // Ctrl/Cmd + N 新建连接
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showConnectionModal();
            }

            // F5 刷新
            if (e.key === 'F5') {
                e.preventDefault();
                this.refreshDatabaseTree();
            }

            // Escape 关闭模态框
            if (e.key === 'Escape') {
                this.hideConnectionModal();
            }
        });
    }

    setupWindowControls() {
        const controls = document.querySelectorAll('.window-control');
        controls.forEach((control, index) => {
            control.addEventListener('click', () => {
                switch (index) {
                    case 0: // 最小化
                        this.minimizeWindow();
                        break;
                    case 1: // 最大化/还原
                        this.toggleMaximizeWindow();
                        break;
                    case 2: // 关闭
                        this.closeWindow();
                        break;
                }
            });
        });
    }

    setupTabSwitching() {
        const resultTabs = document.querySelectorAll('.result-tab');
        resultTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchResultTab(tab);
            });
        });

        const toolbarBtns = document.querySelectorAll('.toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleToolbarAction(btn);
            });
        });
    }

    loadMockData() {
        // 模拟连接数据
        this.connections = [
            {
                id: 1,
                name: 'localhost:8086',
                host: 'localhost',
                port: 8086,
                username: 'admin',
                database: 'mydb',
                status: 'connected'
            },
            {
                id: 2,
                name: 'prod-server:8086',
                host: 'prod-server.example.com',
                port: 8086,
                username: 'readonly',
                database: 'production',
                status: 'disconnected'
            }
        ];

        // 模拟查询历史
        this.queryHistory = [
            {
                id: 1,
                query: 'SELECT * FROM measurement LIMIT 10',
                timestamp: new Date(Date.now() - 3600000),
                duration: 0.023,
                rows: 0
            },
            {
                id: 2,
                query: 'SHOW DATABASES',
                timestamp: new Date(Date.now() - 7200000),
                duration: 0.012,
                rows: 3
            }
        ];

        // 模拟数据库结构 - 更丰富的数据
        this.databaseStructure = {
            databases: [
                {
                    name: 'monitoring',
                    description: '系统监控数据库',
                    retentionPolicies: ['autogen', 'long_term'],
                    measurements: [
                        {
                            name: 'cpu_usage',
                            description: 'CPU使用率监控',
                            fields: [
                                { name: 'usage_idle', type: 'float', description: 'CPU空闲率' },
                                { name: 'usage_system', type: 'float', description: '系统CPU使用率' },
                                { name: 'usage_user', type: 'float', description: '用户CPU使用率' },
                                { name: 'usage_iowait', type: 'float', description: 'IO等待时间' }
                            ],
                            tags: [
                                { name: 'host', description: '主机名' },
                                { name: 'cpu', description: 'CPU核心' },
                                { name: 'region', description: '地理区域' },
                                { name: 'datacenter', description: '数据中心' }
                            ],
                            lastUpdate: new Date(Date.now() - 60000),
                            pointCount: 125847
                        },
                        {
                            name: 'memory_usage',
                            description: '内存使用监控',
                            fields: [
                                { name: 'used', type: 'integer', description: '已使用内存' },
                                { name: 'free', type: 'integer', description: '空闲内存' },
                                { name: 'total', type: 'integer', description: '总内存' },
                                { name: 'available', type: 'integer', description: '可用内存' },
                                { name: 'cached', type: 'integer', description: '缓存内存' },
                                { name: 'buffered', type: 'integer', description: '缓冲内存' }
                            ],
                            tags: [
                                { name: 'host', description: '主机名' },
                                { name: 'region', description: '地理区域' },
                                { name: 'datacenter', description: '数据中心' }
                            ],
                            lastUpdate: new Date(Date.now() - 30000),
                            pointCount: 89234
                        },
                        {
                            name: 'disk_usage',
                            description: '磁盘使用监控',
                            fields: [
                                { name: 'used_percent', type: 'float', description: '磁盘使用率' },
                                { name: 'free_bytes', type: 'integer', description: '空闲空间' },
                                { name: 'total_bytes', type: 'integer', description: '总空间' },
                                { name: 'inodes_used', type: 'integer', description: '已使用inode' },
                                { name: 'inodes_free', type: 'integer', description: '空闲inode' }
                            ],
                            tags: [
                                { name: 'host', description: '主机名' },
                                { name: 'device', description: '设备名' },
                                { name: 'fstype', description: '文件系统类型' },
                                { name: 'path', description: '挂载路径' }
                            ],
                            lastUpdate: new Date(Date.now() - 120000),
                            pointCount: 67891
                        },
                        {
                            name: 'network_traffic',
                            description: '网络流量监控',
                            fields: [
                                { name: 'bytes_sent', type: 'integer', description: '发送字节数' },
                                { name: 'bytes_recv', type: 'integer', description: '接收字节数' },
                                { name: 'packets_sent', type: 'integer', description: '发送包数' },
                                { name: 'packets_recv', type: 'integer', description: '接收包数' },
                                { name: 'err_in', type: 'integer', description: '输入错误' },
                                { name: 'err_out', type: 'integer', description: '输出错误' }
                            ],
                            tags: [
                                { name: 'host', description: '主机名' },
                                { name: 'interface', description: '网络接口' },
                                { name: 'region', description: '地理区域' }
                            ],
                            lastUpdate: new Date(Date.now() - 45000),
                            pointCount: 234567
                        }
                    ]
                },
                {
                    name: 'application_logs',
                    description: '应用程序日志数据库',
                    retentionPolicies: ['autogen', 'short_term'],
                    measurements: [
                        {
                            name: 'api_requests',
                            description: 'API请求监控',
                            fields: [
                                { name: 'response_time', type: 'float', description: '响应时间(ms)' },
                                { name: 'status_code', type: 'integer', description: 'HTTP状态码' },
                                { name: 'request_size', type: 'integer', description: '请求大小' },
                                { name: 'response_size', type: 'integer', description: '响应大小' }
                            ],
                            tags: [
                                { name: 'method', description: 'HTTP方法' },
                                { name: 'endpoint', description: 'API端点' },
                                { name: 'service', description: '服务名称' },
                                { name: 'version', description: '版本号' },
                                { name: 'user_id', description: '用户ID' }
                            ],
                            lastUpdate: new Date(Date.now() - 5000),
                            pointCount: 1567890
                        },
                        {
                            name: 'error_logs',
                            description: '错误日志监控',
                            fields: [
                                { name: 'error_count', type: 'integer', description: '错误数量' },
                                { name: 'severity', type: 'string', description: '严重程度' },
                                { name: 'stack_trace', type: 'string', description: '堆栈跟踪' }
                            ],
                            tags: [
                                { name: 'service', description: '服务名称' },
                                { name: 'error_type', description: '错误类型' },
                                { name: 'environment', description: '环境' }
                            ],
                            lastUpdate: new Date(Date.now() - 15000),
                            pointCount: 45678
                        }
                    ]
                },
                {
                    name: 'business_metrics',
                    description: '业务指标数据库',
                    retentionPolicies: ['autogen', 'long_term', 'archive'],
                    measurements: [
                        {
                            name: 'user_activity',
                            description: '用户活动统计',
                            fields: [
                                { name: 'active_users', type: 'integer', description: '活跃用户数' },
                                { name: 'new_users', type: 'integer', description: '新用户数' },
                                { name: 'session_duration', type: 'float', description: '会话时长' },
                                { name: 'page_views', type: 'integer', description: '页面浏览量' }
                            ],
                            tags: [
                                { name: 'platform', description: '平台' },
                                { name: 'country', description: '国家' },
                                { name: 'device_type', description: '设备类型' }
                            ],
                            lastUpdate: new Date(Date.now() - 300000),
                            pointCount: 789123
                        },
                        {
                            name: 'sales_data',
                            description: '销售数据统计',
                            fields: [
                                { name: 'revenue', type: 'float', description: '收入' },
                                { name: 'orders', type: 'integer', description: '订单数' },
                                { name: 'conversion_rate', type: 'float', description: '转化率' }
                            ],
                            tags: [
                                { name: 'product_category', description: '产品类别' },
                                { name: 'region', description: '地区' },
                                { name: 'channel', description: '渠道' }
                            ],
                            lastUpdate: new Date(Date.now() - 600000),
                            pointCount: 234890
                        }
                    ]
                }
            ]
        };
    }

    initializeUI() {
        this.initExpandedNodes();
        this.updateConnectionStatus();
        this.renderDatabaseTree();
        this.updateQueryEditor();
    }

    showConnectionModal() {
        const modal = document.getElementById('connectionModal');
        modal.classList.remove('hidden');

        // 聚焦到第一个输入框
        setTimeout(() => {
            modal.querySelector('.form-input').focus();
        }, 100);
    }

    hideConnectionModal() {
        const modal = document.getElementById('connectionModal');
        modal.classList.add('hidden');
    }

    updateConnectionStatus() {
        // 更新连接选择器
        this.updateConnectionSelector();

        // 更新标题栏连接指示器
        const titleIndicator = document.querySelector('.connection-indicator .w-2');
        const titleText = document.querySelector('.connection-indicator span');

        if (titleIndicator && titleText) {
            if (this.isConnected) {
                titleIndicator.className = 'w-2 h-2 bg-geek-green rounded-full animate-pulse';
                titleText.textContent = '在线';
            } else {
                titleIndicator.className = 'w-2 h-2 bg-geek-red rounded-full animate-pulse';
                titleText.textContent = '离线';
            }
        }
    }

    renderDatabaseTree() {
        const treeContainer = document.querySelector('.database-tree');

        if (!this.isConnected) {
            treeContainer.innerHTML = `
                <div class="empty-state text-center py-8">
                    <div class="empty-icon mb-4">
                        <i class="fas fa-database text-4xl text-geek-text-muted opacity-30"></i>
                    </div>
                    <p class="text-geek-text-muted">未连接到数据库</p>
                    <p class="text-sm text-geek-text-muted mt-1">请选择连接或创建新连接</p>
                </div>
            `;
            return;
        }

        let treeHTML = '';
        this.databaseStructure.databases.forEach((db, dbIndex) => {
            const dbId = `db-${dbIndex}`;
            const isExpanded = this.expandedNodes?.has(dbId) || false;

            treeHTML += `
                <div class="tree-item database-item" data-id="${dbId}">
                    <div class="database-header flex items-center justify-between py-2 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                        <div class="flex items-center space-x-2">
                            <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}"></i>
                            <i class="fas fa-database text-geek-green text-sm"></i>
                            <div class="flex flex-col">
                                <span class="text-sm font-medium text-geek-text">${db.name}</span>
                                <span class="text-xs text-geek-text-muted">${db.description}</span>
                            </div>
                        </div>
                        <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="text-xs text-geek-text-muted bg-geek-darker px-2 py-1 rounded">${db.measurements.length}</span>
                            <button class="p-1 hover:bg-geek-darker rounded" title="数据库选项" onclick="event.stopPropagation(); app.showDatabaseMenu('${db.name}')">
                                <i class="fas fa-ellipsis-v text-xs text-geek-text-muted"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tree-children ml-6 ${isExpanded ? '' : 'hidden'} space-y-1">
                        <!-- Retention Policies -->
                        <div class="tree-item retention-policies">
                            <div class="flex items-center space-x-2 py-1.5 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                                <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200"></i>
                                <i class="fas fa-clock text-geek-blue text-sm"></i>
                                <span class="text-sm text-geek-text-secondary">保留策略</span>
                                <span class="text-xs text-geek-text-muted">(${db.retentionPolicies.length})</span>
                            </div>
                            <div class="tree-children ml-6 hidden space-y-1">
                                ${db.retentionPolicies.map(policy => `
                                    <div class="tree-item">
                                        <div class="flex items-center space-x-2 py-1.5 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200">
                                            <i class="fas fa-shield-alt text-geek-blue text-sm"></i>
                                            <span class="text-sm text-geek-text-secondary">${policy}</span>
                                            ${policy === 'autogen' ? '<span class="text-xs text-geek-text-muted bg-geek-blue bg-opacity-20 px-2 py-0.5 rounded-full">默认</span>' : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <!-- Measurements -->
                        <div class="tree-item measurements">
                            <div class="flex items-center justify-between py-1.5 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200"></i>
                                    <i class="fas fa-table text-geek-cyan text-sm"></i>
                                    <span class="text-sm text-geek-text-secondary">测量表</span>
                                    <span class="text-xs text-geek-text-muted">(${db.measurements.length})</span>
                                </div>
                                <button class="opacity-0 group-hover:opacity-100 p-1 hover:bg-geek-darker rounded transition-opacity" title="展开全部" onclick="event.stopPropagation(); app.expandAllMeasurements('${db.name}')">
                                    <i class="fas fa-expand-arrows-alt text-xs text-geek-text-muted"></i>
                                </button>
                            </div>
                            <div class="tree-children ml-6 hidden space-y-1">
                                ${db.measurements.map((measurement, measurementIndex) => {
                const measurementId = `${dbId}-measurement-${measurementIndex}`;
                const timeSince = this.getTimeSince(measurement.lastUpdate);
                const pointCountFormatted = this.formatNumber(measurement.pointCount);

                return `
                                        <div class="tree-item measurement-item" data-id="${measurementId}">
                                            <div class="measurement-header flex items-center justify-between py-1.5 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                                                <div class="flex items-center space-x-2">
                                                    <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200"></i>
                                                    <i class="fas fa-chart-line text-geek-orange text-sm"></i>
                                                    <div class="flex flex-col">
                                                        <span class="text-sm text-geek-text-secondary">${measurement.name}</span>
                                                        <div class="flex items-center space-x-2 text-xs text-geek-text-muted">
                                                            <span>${pointCountFormatted} 数据点</span>
                                                            <span>•</span>
                                                            <span>${timeSince}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button class="p-1 hover:bg-geek-darker rounded" title="快速查询" onclick="event.stopPropagation(); app.quickQuery('${db.name}', '${measurement.name}')">
                                                        <i class="fas fa-play text-geek-green text-xs"></i>
                                                    </button>
                                                    <button class="p-1 hover:bg-geek-darker rounded" title="查看详情" onclick="event.stopPropagation(); app.showMeasurementDetails('${db.name}', '${measurement.name}')">
                                                        <i class="fas fa-info text-geek-blue text-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="tree-children ml-6 hidden space-y-1">
                                                <!-- Fields -->
                                                <div class="tree-item fields">
                                                    <div class="flex items-center space-x-2 py-1 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                                                        <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200"></i>
                                                        <i class="fas fa-tag text-geek-cyan text-sm"></i>
                                                        <span class="text-sm text-geek-text-muted">字段</span>
                                                        <span class="text-xs text-geek-text-muted">(${measurement.fields.length})</span>
                                                    </div>
                                                    <div class="tree-children ml-6 hidden space-y-1">
                                                        ${measurement.fields.map(field => `
                                                            <div class="tree-item field-item">
                                                                <div class="flex items-center justify-between py-1 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" onclick="app.selectField('${db.name}', '${measurement.name}', '${field.name}')">
                                                                    <div class="flex items-center space-x-2">
                                                                        <i class="fas fa-hashtag text-geek-cyan text-xs"></i>
                                                                        <div class="flex flex-col">
                                                                            <span class="text-sm text-geek-text-muted">${field.name}</span>
                                                                            <span class="text-xs text-geek-text-muted opacity-75">${field.type} • ${field.description}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span class="text-xs text-geek-text-muted bg-geek-darker px-2 py-0.5 rounded">${field.type}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                
                                                <!-- Tags -->
                                                <div class="tree-item tags">
                                                    <div class="flex items-center space-x-2 py-1 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200" onclick="app.toggleTreeNode(this.querySelector('.tree-toggle'))">
                                                        <i class="fas fa-chevron-right text-xs text-geek-text-muted tree-toggle transition-transform duration-200"></i>
                                                        <i class="fas fa-tags text-geek-blue text-sm"></i>
                                                        <span class="text-sm text-geek-text-muted">标签</span>
                                                        <span class="text-xs text-geek-text-muted">(${measurement.tags.length})</span>
                                                    </div>
                                                    <div class="tree-children ml-6 hidden space-y-1">
                                                        ${measurement.tags.map(tag => `
                                                            <div class="tree-item tag-item">
                                                                <div class="flex items-center justify-between py-1 px-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" onclick="app.selectTag('${db.name}', '${measurement.name}', '${tag.name}')">
                                                                    <div class="flex items-center space-x-2">
                                                                        <i class="fas fa-tag text-geek-blue text-xs"></i>
                                                                        <div class="flex flex-col">
                                                                            <span class="text-sm text-geek-text-muted">${tag.name}</span>
                                                                            <span class="text-xs text-geek-text-muted opacity-75">${tag.description}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <span class="text-xs text-geek-text-muted bg-geek-darker px-2 py-0.5 rounded">tag</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `;
            }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        treeContainer.innerHTML = treeHTML;
    }

    toggleTreeNode(toggleElement) {
        const isExpanded = toggleElement.classList.contains('expanded');
        const treeItem = toggleElement.closest('.tree-item');
        const children = treeItem.querySelector('.tree-children');

        if (isExpanded) {
            toggleElement.classList.remove('expanded');
            children.classList.add('hidden');
        } else {
            toggleElement.classList.add('expanded');
            children.classList.remove('hidden');
        }
    }

    selectMeasurement(measurementName) {
        const query = `SELECT * FROM ${measurementName} LIMIT 10`;
        this.setQueryText(query);
        this.showNotification(`已选择测量: ${measurementName}`, 'info');
    }

    setQueryText(query) {
        const codeContent = document.querySelector('.code-content');
        codeContent.innerHTML = this.highlightSQL(query);
    }

    highlightSQL(sql) {
        const keywords = ['SELECT', 'FROM', 'WHERE', 'LIMIT', 'ORDER BY', 'GROUP BY', 'HAVING', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'SHOW', 'DESCRIBE'];
        const operators = ['=', '!=', '<', '>', '<=', '>=', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'BETWEEN'];

        let highlighted = sql;

        // 高亮关键字
        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
        });

        // 高亮操作符
        operators.forEach(operator => {
            const regex = new RegExp(`\\b${operator}\\b`, 'gi');
            highlighted = highlighted.replace(regex, `<span class="operator">${operator}</span>`);
        });

        // 高亮字符串
        highlighted = highlighted.replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>');
        highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');

        // 高亮数字
        highlighted = highlighted.replace(/\b\d+\b/g, '<span class="number">$&</span>');

        return `<div class="code-line">${highlighted}</div>`;
    }

    executeQuery() {
        // 如果有真实连接，使用真实查询
        if (this.influxClient) {
            this.executeRealQuery();
        } else {
            // 否则使用模拟查询
            this.executeSimulatedQuery();
        }
    }

    executeSimulatedQuery() {
        if (!this.isConnected) {
            this.showNotification('请先连接到数据库', 'error');
            return;
        }

        const codeContent = document.querySelector('.code-content');
        const query = codeContent.textContent.trim();

        if (!query) {
            this.showNotification('请输入查询语句', 'warning');
            return;
        }

        this.showNotification('正在执行查询...', 'info');

        // 模拟查询执行
        setTimeout(() => {
            this.handleQueryResult(query);
        }, Math.random() * 1000 + 500);
    }

    handleQueryResult(query) {
        const startTime = Date.now();
        const duration = (Math.random() * 0.1 + 0.01).toFixed(3);
        const rows = Math.floor(Math.random() * 100);

        // 更新查询历史
        this.queryHistory.unshift({
            id: Date.now(),
            query: query,
            timestamp: new Date(),
            duration: parseFloat(duration),
            rows: rows
        });

        // 更新结果面板
        this.updateResultsPanel(query, duration, rows);

        // 显示成功通知
        this.showNotification(`查询完成 - ${rows} 行，耗时 ${duration}s`, 'success');
    }

    updateResultsPanel(query, duration, rows) {
        const resultsContent = document.querySelector('.results-content');
        const executionInfo = document.querySelector('.results-header .text-xs');

        // 更新执行信息
        executionInfo.innerHTML = `
            <span>执行时间: ${duration}s</span>
            <span>|</span>
            <span>${rows} 行</span>
        `;

        if (rows === 0) {
            resultsContent.innerHTML = `
                <div class="empty-state text-center py-12">
                    <div class="empty-icon mb-4">
                        <i class="fas fa-database text-6xl text-primary-400"></i>
                    </div>
                    <p class="text-muted">暂无查询结果</p>
                    <p class="text-sm text-muted mt-2">查询未返回任何数据</p>
                </div>
            `;
        } else {
            // 生成模拟数据表格
            const mockData = this.generateMockData(rows);
            resultsContent.innerHTML = this.renderDataTable(mockData);
        }
    }

    generateMockData(rows) {
        const columns = ['time', 'host', 'region', 'value'];
        const data = [];

        for (let i = 0; i < rows; i++) {
            data.push({
                time: new Date(Date.now() - i * 60000).toISOString(),
                host: `server-${Math.floor(Math.random() * 10) + 1}`,
                region: ['us-east-1', 'us-west-2', 'eu-west-1'][Math.floor(Math.random() * 3)],
                value: (Math.random() * 100).toFixed(2)
            });
        }

        return { columns, data };
    }

    renderDataTable(tableData) {
        const { columns, data } = tableData;

        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        return tableHTML;
    }

    switchResultTab(clickedTab) {
        // 移除所有活动状态
        document.querySelectorAll('.result-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // 激活点击的标签
        clickedTab.classList.add('active');

        const tabText = clickedTab.textContent.trim();
        const resultsContent = document.querySelector('.results-content');

        switch (tabText) {
            case '清空':
                this.clearResults();
                break;
            case '复制':
                this.copyResults();
                break;
            case 'JSON':
                this.showJSONResults();
                break;
            default:
                // 结果标签，不需要特殊处理
                break;
        }
    }

    clearResults() {
        const resultsContent = document.querySelector('.results-content');
        resultsContent.innerHTML = `
            <div class="empty-state text-center py-12">
                <div class="empty-icon mb-4">
                    <i class="fas fa-database text-6xl text-primary-400"></i>
                </div>
                <p class="text-muted">结果已清空</p>
            </div>
        `;

        // 重置执行信息
        const executionInfo = document.querySelector('.results-header .text-xs');
        executionInfo.innerHTML = `
            <span>执行时间: 0s</span>
            <span>|</span>
            <span>0 行</span>
        `;

        this.showNotification('结果已清空', 'info');
    }

    copyResults() {
        // 模拟复制功能
        this.showNotification('结果已复制到剪贴板', 'success');
    }

    showJSONResults() {
        const resultsContent = document.querySelector('.results-content');
        const mockJSON = {
            "series": [
                {
                    "name": "measurement",
                    "columns": ["time", "host", "region", "value"],
                    "values": [
                        ["2024-01-15T10:30:00Z", "server-1", "us-east-1", 85.2],
                        ["2024-01-15T10:29:00Z", "server-2", "us-west-2", 72.8],
                        ["2024-01-15T10:28:00Z", "server-3", "eu-west-1", 91.5]
                    ]
                }
            ]
        };

        resultsContent.innerHTML = `
            <pre class="json-output"><code>${JSON.stringify(mockJSON, null, 2)}</code></pre>
        `;
    }

    handleToolbarAction(button) {
        const action = button.textContent.trim();

        switch (action) {
            case '历史':
                this.showQueryHistory();
                break;
            case '示例':
                this.showQueryExamples();
                break;
            case '重置状态':
                this.resetState();
                break;
            case '保存':
                this.saveQuery();
                break;
            case '分享':
                this.shareQuery();
                break;
        }
    }

    showQueryHistory() {
        // 切换活动状态
        document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const resultsContent = document.querySelector('.results-content');
        let historyHTML = `
            <div class="query-history">
                <h3 class="text-lg font-semibold mb-4 text-accent-green">查询历史</h3>
                <div class="space-y-3">
        `;

        this.queryHistory.forEach(item => {
            historyHTML += `
                <div class="history-item p-3 bg-card border border-primary-border rounded-lg cursor-pointer hover:border-accent-green transition-colors" onclick="app.loadHistoryQuery('${item.query}')">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm text-muted">${item.timestamp.toLocaleString()}</span>
                        <div class="flex items-center space-x-2 text-xs text-muted">
                            <span>${item.duration}s</span>
                            <span>|</span>
                            <span>${item.rows} 行</span>
                        </div>
                    </div>
                    <code class="text-sm text-secondary">${item.query}</code>
                </div>
            `;
        });

        historyHTML += `
                </div>
            </div>
        `;

        resultsContent.innerHTML = historyHTML;
    }

    loadHistoryQuery(query) {
        this.setQueryText(query);
        this.showNotification('已加载历史查询', 'info');
    }

    showQueryExamples() {
        document.querySelectorAll('.toolbar-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const examples = [
            {
                title: '查询所有数据',
                query: 'SELECT * FROM measurement LIMIT 100',
                description: '获取measurement表的前100条记录'
            },
            {
                title: '按时间范围查询',
                query: 'SELECT * FROM cpu_usage WHERE time >= now() - 1h',
                description: '查询最近1小时的CPU使用率数据'
            },
            {
                title: '聚合查询',
                query: 'SELECT mean(value) FROM cpu_usage WHERE time >= now() - 1d GROUP BY time(1h)',
                description: '按小时分组计算最近一天的CPU平均使用率'
            },
            {
                title: '显示数据库',
                query: 'SHOW DATABASES',
                description: '列出所有可用的数据库'
            },
            {
                title: '显示测量',
                query: 'SHOW MEASUREMENTS',
                description: '显示当前数据库中的所有测量'
            }
        ];

        const resultsContent = document.querySelector('.results-content');
        let examplesHTML = `
            <div class="query-examples">
                <h3 class="text-lg font-semibold mb-4 text-accent-green">查询示例</h3>
                <div class="space-y-4">
        `;

        examples.forEach(example => {
            examplesHTML += `
                <div class="example-item p-4 bg-card border border-primary-border rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-secondary">${example.title}</h4>
                        <button class="btn-secondary text-xs py-1 px-2" onclick="app.loadExampleQuery('${example.query}')">
                            <i class="fas fa-copy mr-1"></i>使用
                        </button>
                    </div>
                    <p class="text-sm text-muted mb-3">${example.description}</p>
                    <code class="block p-2 bg-primary-100 rounded text-sm text-accent-green">${example.query}</code>
                </div>
            `;
        });

        examplesHTML += `
                </div>
            </div>
        `;

        resultsContent.innerHTML = examplesHTML;
    }

    loadExampleQuery(query) {
        this.setQueryText(query);
        this.showNotification('已加载示例查询', 'info');
    }

    resetState() {
        this.queryHistory = [];
        this.clearResults();
        this.setQueryText('SELECT * FROM measurement LIMIT 10');
        this.showNotification('状态已重置', 'info');
    }

    saveQuery() {
        const query = document.querySelector('.code-content').textContent.trim();
        if (!query) {
            this.showNotification('没有可保存的查询', 'warning');
            return;
        }

        // 模拟保存功能
        this.showNotification('查询已保存', 'success');
    }

    shareQuery() {
        const query = document.querySelector('.code-content').textContent.trim();
        if (!query) {
            this.showNotification('没有可分享的查询', 'warning');
            return;
        }

        // 模拟分享功能
        this.showNotification('分享链接已复制到剪贴板', 'success');
    }

    refreshDatabaseTree() {
        const refreshBtn = document.querySelector('.refresh-btn i');
        refreshBtn.classList.add('loading');

        setTimeout(() => {
            this.renderDatabaseTree();
            refreshBtn.classList.remove('loading');
            this.showNotification('数据库结构已刷新', 'success');
        }, 1000);
    }

    minimizeWindow() {
        this.showNotification('窗口最小化', 'info');
    }

    toggleMaximizeWindow() {
        const isMaximized = document.body.classList.contains('maximized');
        if (isMaximized) {
            document.body.classList.remove('maximized');
            this.showNotification('窗口已还原', 'info');
        } else {
            document.body.classList.add('maximized');
            this.showNotification('窗口已最大化', 'info');
        }
    }

    closeWindow() {
        if (confirm('确定要关闭 InfluxDB Studio 吗？')) {
            this.showNotification('正在关闭应用...', 'info');
            setTimeout(() => {
                window.close();
            }, 1000);
        }
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;

        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type];

        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;

        // 添加通知样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-md);
            color: var(--color-text-primary);
            font-family: var(--font-mono);
            font-size: 14px;
            z-index: 10000;
            box-shadow: var(--shadow-lg);
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        // 根据类型设置颜色
        const colors = {
            success: 'var(--color-accent-green)',
            error: 'var(--color-error-red)',
            warning: 'var(--color-warning-orange)',
            info: 'var(--color-accent-cyan)'
        };

        notification.style.borderLeftColor = colors[type];
        notification.style.borderLeftWidth = '4px';

        document.body.appendChild(notification);

        // 自动移除通知
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // 模拟连接功能
    simulateConnection() {
        this.isConnected = !this.isConnected;
        this.updateConnectionStatus();
        this.renderDatabaseTree();

        if (this.isConnected) {
            this.showNotification('已连接到数据库', 'success');
        } else {
            this.showNotification('已断开数据库连接', 'info');
        }
    }
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .json-output {
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-md);
        padding: var(--spacing-md);
        font-family: var(--font-mono);
        font-size: 12px;
        color: var(--color-text-secondary);
        overflow: auto;
        max-height: 400px;
    }
    
    .json-output code {
        color: var(--color-accent-green);
    }
    
    .history-item:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }
    
    .example-item:hover {
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
    }
    
    body.maximized {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
    }
`;
document.head.appendChild(style);

// 初始化应用
const app = new InfluxDBStudio();

// 添加连接按钮点击事件（模拟连接）
// 注意：由于UI重构，连接按钮现在集成在下拉菜单中
// 这里添加一个通用的连接切换快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + C 快速切换连接状态
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        app.simulateConnection();
    }
});

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('应用错误:', e.error);
    app.showNotification('应用发生错误，请检查控制台', 'error');
});

// 页面加载完成提示
window.addEventListener('load', () => {
    app.showNotification('InfluxDB Studio 已就绪', 'success');
});

console.log('🚀 InfluxDB Studio - Geek Edition 已启动');
console.log('💡 快捷键:');
console.log('   Ctrl/Cmd + Enter: 执行查询');
console.log('   Ctrl/Cmd + N: 新建连接');
console.log('   F5: 刷新数据库结构');
console.log('   Escape: 关闭模态框');

// InfluxDB 连接客户端类
class InfluxDBClient {
    constructor(config) {
        this.config = config;
        this.baseUrl = `http://${config.host}:${config.port}`;
        this.token = config.token;
        this.org = config.org;
        this.bucket = config.bucket;
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('连接测试失败:', error);
            return false;
        }
    }

    async query(fluxQuery) {
        try {
            const response = await fetch(`${this.baseUrl}/api/v2/query`, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/vnd.flux'
                },
                body: fluxQuery
            });

            if (!response.ok) {
                throw new Error(`查询失败: ${response.statusText}`);
            }

            return await response.text();
        } catch (error) {
            console.error('查询执行失败:', error);
            throw error;
        }
    }

    async getBuckets() {
        try {
            const response = await fetch(`${this.baseUrl}/api/v2/buckets`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`获取存储桶失败: ${response.statusText}`);
            }

            const data = await response.json();
            return data.buckets || [];
        } catch (error) {
            console.error('获取存储桶失败:', error);
            return [];
        }
    }

    async getMeasurements(bucket) {
        const fluxQuery = `
            import "influxdata/influxdb/schema"
            schema.measurements(bucket: "${bucket}")
        `;

        try {
            const result = await this.query(fluxQuery);
            return this.parseFluxResult(result);
        } catch (error) {
            console.error('获取测量失败:', error);
            return [];
        }
    }

    getHeaders() {
        return {
            'Authorization': `Token ${this.token}`,
            'Accept': 'application/json'
        };
    }

    parseFluxResult(csvData) {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim() || '';
            });
            data.push(row);
        }

        return data;
    }
}

// 查询构建器类
class QueryBuilder {
    constructor() {
        this.reset();
    }

    reset() {
        this.bucket = '';
        this.measurement = '';
        this.fields = [];
        this.filters = [];
        this.timeRange = '';
        this.groupBy = [];
        this.aggregation = '';
        this.limit = null;
        return this;
    }

    from(bucket) {
        this.bucket = bucket;
        return this;
    }

    filter(measurement) {
        this.measurement = measurement;
        return this;
    }

    select(fields) {
        this.fields = Array.isArray(fields) ? fields : [fields];
        return this;
    }

    where(condition) {
        this.filters.push(condition);
        return this;
    }

    range(start, stop = 'now()') {
        this.timeRange = `range(start: ${start}, stop: ${stop})`;
        return this;
    }

    group(columns) {
        this.groupBy = Array.isArray(columns) ? columns : [columns];
        return this;
    }

    aggregate(func, column = '_value') {
        this.aggregation = `${func}(column: "${column}")`;
        return this;
    }

    limitTo(count) {
        this.limit = count;
        return this;
    }

    build() {
        let query = `from(bucket: "${this.bucket}")`;

        if (this.timeRange) {
            query += `\n  |> ${this.timeRange}`;
        }

        if (this.measurement) {
            query += `\n  |> filter(fn: (r) => r["_measurement"] == "${this.measurement}")`;
        }

        this.filters.forEach(filter => {
            query += `\n  |> filter(fn: (r) => ${filter})`;
        });

        if (this.fields.length > 0) {
            const fieldFilter = this.fields.map(field => `r["_field"] == "${field}"`).join(' or ');
            query += `\n  |> filter(fn: (r) => ${fieldFilter})`;
        }

        if (this.groupBy.length > 0) {
            query += `\n  |> group(columns: [${this.groupBy.map(col => `"${col}"`).join(', ')}])`;
        }

        if (this.aggregation) {
            query += `\n  |> ${this.aggregation}`;
        }

        if (this.limit) {
            query += `\n  |> limit(n: ${this.limit})`;
        }

        return query;
    }
}

// 数据可视化类
class DataVisualizer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.charts = new Map();
    }

    createTimeSeriesChart(data, options = {}) {
        const chartId = `chart-${Date.now()}`;
        const chartContainer = document.createElement('div');
        chartContainer.id = chartId;
        chartContainer.className = 'chart-container';
        chartContainer.style.cssText = `
            width: 100%;
            height: 300px;
            background: var(--color-bg-card);
            border: 1px solid var(--color-border-primary);
            border-radius: var(--radius-md);
            padding: var(--spacing-md);
            margin-bottom: var(--spacing-md);
        `;

        this.container.appendChild(chartContainer);

        // 简单的SVG时序图实现
        const svg = this.createSVGChart(data, options);
        chartContainer.appendChild(svg);

        return chartId;
    }

    createSVGChart(data, options) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '250');
        svg.style.background = 'var(--color-bg-secondary)';

        if (!data || data.length === 0) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '50%');
            text.setAttribute('y', '50%');
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'var(--color-text-muted)');
            text.textContent = '暂无数据';
            svg.appendChild(text);
            return svg;
        }

        // 计算数据范围
        const values = data.map(d => parseFloat(d._value) || 0);
        const times = data.map(d => new Date(d._time));

        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        const padding = 40;
        const width = 800 - 2 * padding;
        const height = 250 - 2 * padding;

        // 创建坐标轴
        const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxis.setAttribute('x1', padding);
        xAxis.setAttribute('y1', height + padding);
        xAxis.setAttribute('x2', width + padding);
        xAxis.setAttribute('y2', height + padding);
        xAxis.setAttribute('stroke', 'var(--color-border-primary)');
        svg.appendChild(xAxis);

        const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxis.setAttribute('x1', padding);
        yAxis.setAttribute('y1', padding);
        yAxis.setAttribute('x2', padding);
        yAxis.setAttribute('y2', height + padding);
        yAxis.setAttribute('stroke', 'var(--color-border-primary)');
        svg.appendChild(yAxis);

        // 绘制数据点和连线
        let pathData = '';
        data.forEach((point, index) => {
            const x = padding + (new Date(point._time) - minTime) / (maxTime - minTime) * width;
            const y = padding + (maxValue - parseFloat(point._value)) / (maxValue - minValue) * height;

            if (index === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }

            // 数据点
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 3);
            circle.setAttribute('fill', 'var(--color-accent-green)');
            svg.appendChild(circle);
        });

        // 连线
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', 'var(--color-accent-green)');
        path.setAttribute('stroke-width', 2);
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        return svg;
    }

    createMetricsGrid(metrics) {
        const grid = document.createElement('div');
        grid.className = 'metrics-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: var(--spacing-md);
            margin-bottom: var(--spacing-lg);
        `;

        metrics.forEach(metric => {
            const card = document.createElement('div');
            card.className = 'metric-card';
            card.style.cssText = `
                background: var(--color-bg-card);
                border: 1px solid var(--color-border-primary);
                border-radius: var(--radius-md);
                padding: var(--spacing-md);
                text-align: center;
            `;

            card.innerHTML = `
                <div class="metric-value" style="font-size: 2rem; font-weight: bold; color: var(--color-accent-green);">
                    ${metric.value}
                </div>
                <div class="metric-label" style="color: var(--color-text-secondary); margin-top: var(--spacing-xs);">
                    ${metric.label}
                </div>
                <div class="metric-change" style="font-size: 0.8rem; color: ${metric.change >= 0 ? 'var(--color-accent-green)' : 'var(--color-error-red)'}; margin-top: var(--spacing-xs);">
                    ${metric.change >= 0 ? '↗' : '↘'} ${Math.abs(metric.change)}%
                </div>
            `;

            grid.appendChild(card);
        });

        return grid;
    }
}

    async initializeRealConnection() {
        if (!this.currentConnection) return false;

        try {
            this.influxClient = new InfluxDBClient(this.currentConnection);
            const isConnected = await this.influxClient.testConnection();

            if (isConnected) {
                this.isConnected = true;
                await this.loadRealDatabaseStructure();
                this.updateConnectionStatus();
                this.renderDatabaseTree();
                this.showNotification('成功连接到InfluxDB', 'success');
                return true;
            } else {
                throw new Error('连接测试失败');
            }
        } catch (error) {
            this.showNotification(`连接失败: ${error.message}`, 'error');
            return false;
        }
    }

    async loadRealDatabaseStructure() {
        try {
            const buckets = await this.influxClient.getBuckets();
            this.databaseStructure = { databases: [] };

            for (const bucket of buckets) {
                const measurements = await this.influxClient.getMeasurements(bucket.name);
                this.databaseStructure.databases.push({
                    name: bucket.name,
                    measurements: measurements.map(m => ({
                        name: m._value,
                        fields: [],
                        tags: []
                    }))
                });
            }
        } catch (error) {
            console.error('加载数据库结构失败:', error);
            this.showNotification('加载数据库结构失败', 'error');
        }
    }

    async executeRealQuery() {
        if (!this.isConnected || !this.influxClient) {
            this.showNotification('请先连接到数据库', 'error');
            return;
        }

        const codeContent = document.querySelector('.code-content');
        const query = codeContent.textContent.trim();

        if (!query) {
            this.showNotification('请输入查询语句', 'warning');
            return;
        }

        this.showNotification('正在执行查询...', 'info');
        const startTime = Date.now();

        try {
            const result = await this.influxClient.query(query);
            const duration = ((Date.now() - startTime) / 1000).toFixed(3);
            const data = this.influxClient.parseFluxResult(result);

            // 更新查询历史
            this.queryHistory.unshift({
                id: Date.now(),
                query: query,
                timestamp: new Date(),
                duration: parseFloat(duration),
                rows: data.length
            });

            // 更新结果面板
            this.updateResultsPanel(query, duration, data.length);
            this.renderQueryResults(data);

            this.showNotification(`查询完成 - ${data.length} 行，耗时 ${duration}s`, 'success');
        } catch (error) {
            this.showNotification(`查询失败: ${error.message}`, 'error');
            console.error('查询执行失败:', error);
        }
    }

    renderQueryResults(data) {
        const resultsContent = document.querySelector('.results-content');

        if (!data || data.length === 0) {
            resultsContent.innerHTML = `
                <div class="empty-state text-center py-12">
                    <div class="empty-icon mb-4">
                        <i class="fas fa-database text-6xl text-primary-400"></i>
                    </div>
                    <p class="text-muted">查询未返回任何数据</p>
                </div>
            `;
            return;
        }

        // 检查是否为时序数据
        const hasTimeColumn = data.some(row => row._time);
        const hasValueColumn = data.some(row => row._value);

        if (hasTimeColumn && hasValueColumn) {
            // 创建可视化
            const visualizer = new DataVisualizer('visualization-container');

            // 创建容器
            const vizContainer = document.createElement('div');
            vizContainer.id = 'visualization-container';
            vizContainer.style.marginBottom = 'var(--spacing-lg)';

            resultsContent.innerHTML = '';
            resultsContent.appendChild(vizContainer);

            // 创建时序图
            visualizer.createTimeSeriesChart(data, {
                title: '时序数据图表',
                xLabel: '时间',
                yLabel: '数值'
            });

            // 创建指标卡片
            const metrics = this.calculateMetrics(data);
            const metricsGrid = visualizer.createMetricsGrid(metrics);
            resultsContent.appendChild(metricsGrid);
        }

        // 始终显示数据表格
        const tableData = {
            columns: Object.keys(data[0] || {}),
            data: data
        };
        const tableHTML = this.renderDataTable(tableData);
        const tableContainer = document.createElement('div');
        tableContainer.innerHTML = tableHTML;
        resultsContent.appendChild(tableContainer);
    }

    calculateMetrics(data) {
        if (!data || data.length === 0) return [];

        const values = data.map(d => parseFloat(d._value) || 0).filter(v => !isNaN(v));

        if (values.length === 0) return [];

        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        // 计算变化率（简化版）
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        const change = firstValue !== 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;

        return [
            { label: '平均值', value: avg.toFixed(2), change: change },
            { label: '最大值', value: max.toFixed(2), change: 0 },
            { label: '最小值', value: min.toFixed(2), change: 0 },
            { label: '数据点', value: values.length, change: 0 }
        ];
    }

    buildSmartQuery(measurement, timeRange = '1h') {
        const builder = new QueryBuilder();

        const query = builder
            .from(this.currentConnection?.bucket || 'default')
            .range(`-${timeRange}`)
            .filter(measurement)
            .limitTo(100)
            .build();

        this.setQueryText(query);
        this.showNotification(`已生成智能查询: ${measurement}`, 'info');
    }

    getQuerySuggestions(input) {
        const suggestions = [
            'from(bucket: "my-bucket")',
            'range(start: -1h)',
            'filter(fn: (r) => r["_measurement"] == "cpu")',
            'aggregateWindow(every: 1m, fn: mean)',
            'group(columns: ["host"])',
            'limit(n: 100)'
        ];

        return suggestions.filter(s =>
            s.toLowerCase().includes(input.toLowerCase())
        );
    }

console.log('🔧 InfluxDB Studio 增强功能已加载');
console.log('✨ 新增功能:');
console.log('   - 真实InfluxDB连接');
console.log('   - Flux查询构建器');
console.log('   - 数据可视化');
console.log('   - 智能查询建议');
    setupConnectionDropdown() {
        const dropdownBtn = document.querySelector('.connection-dropdown-btn');
        const dropdown = document.querySelector('.connection-dropdown');

        if (!dropdownBtn || !dropdown) return;

        // 点击按钮切换下拉菜单
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleConnectionDropdown();
        });

        // 点击连接选项
        dropdown.addEventListener('click', (e) => {
            const connectionOption = e.target.closest('.connection-option');
            if (connectionOption) {
                const connectionText = connectionOption.querySelector('.text-sm').textContent;
                if (connectionText === '新建连接') {
                    this.showConnectionModal();
                } else {
                    this.selectConnection(connectionText);
                }
                this.hideConnectionDropdown();
            }
        });

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
                this.hideConnectionDropdown();
            }
        });

        // 初始化连接选择器状态
        this.updateConnectionSelector();
    }

    toggleConnectionDropdown() {
        const dropdown = document.querySelector('.connection-dropdown');
        dropdown.classList.toggle('hidden');
    }

    hideConnectionDropdown() {
        const dropdown = document.querySelector('.connection-dropdown');
        dropdown.classList.add('hidden');
    }

    selectConnection(connectionName) {
        // 查找对应的连接
        const connection = this.connections.find(conn => conn.name === connectionName);
        if (connection) {
            this.currentConnection = connection;
            this.isConnected = connection.status === 'connected';
            this.updateConnectionSelector();
            this.renderDatabaseTree();
            this.showNotification(`已选择连接: ${connectionName}`, 'info');
        }
    }

    updateConnectionSelector() {
        const dropdownBtn = document.querySelector('.connection-dropdown-btn');
        if (!dropdownBtn) return;

        const statusIndicator = dropdownBtn.querySelector('.status-indicator');
        const serverIcon = dropdownBtn.querySelector('.fas.fa-server');
        const nameElement = dropdownBtn.querySelector('.text-sm');
        const descElement = dropdownBtn.querySelector('.text-xs');

        if (this.currentConnection) {
            const isConnected = this.currentConnection.status === 'connected';

            // 更新状态指示器
            statusIndicator.className = `status-indicator w-2 h-2 rounded-full ${isConnected ? 'bg-geek-green animate-pulse' : 'bg-geek-red'
                }`;

            // 更新服务器图标
            serverIcon.className = `fas fa-server text-sm ${isConnected ? 'text-geek-green' : 'text-geek-text-muted'
                }`;

            // 更新连接信息
            nameElement.textContent = this.currentConnection.name;
            nameElement.className = `text-sm font-medium ${isConnected ? 'text-geek-text' : 'text-geek-text-muted'
                }`;

            descElement.textContent = `${this.currentConnection.database || 'default'} • ${isConnected ? '已连接' : '离线'
                }`;
        } else {
            // 未选择连接的状态
            statusIndicator.className = 'status-indicator w-2 h-2 bg-geek-red rounded-full animate-pulse';
            serverIcon.className = 'fas fa-server text-geek-text-muted text-sm';
            nameElement.textContent = '未选择连接';
            nameElement.className = 'text-sm font-medium text-geek-text-muted';
            descElement.textContent = '点击选择或创建连接';
        }
    }

// 添加搜索功能
InfluxDBStudio.prototype.setupSearchFunctionality = function () {
    const searchInput = document.querySelector('input[placeholder*="搜索"]');
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim().toLowerCase();

        // 防抖搜索
        searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    });

    // 回车键快速搜索
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            this.performSearch(e.target.value.trim().toLowerCase());
        }
    });
};

InfluxDBStudio.prototype.performSearch = function (query) {
    const treeContainer = document.querySelector('.database-tree');
    if (!treeContainer) return;

    if (!query) {
        // 清空搜索，显示完整树结构
        this.renderDatabaseTree();
        return;
    }

    // 搜索匹配的项目
    const results = this.searchDatabaseStructure(query);
    this.renderSearchResults(results, query);
};

InfluxDBStudio.prototype.searchDatabaseStructure = function (query) {
    const results = [];

    if (!this.databaseStructure || !this.databaseStructure.databases) {
        return results;
    }

    this.databaseStructure.databases.forEach(db => {
        // 搜索数据库名
        if (db.name.toLowerCase().includes(query)) {
            results.push({
                type: 'database',
                name: db.name,
                path: db.name,
                icon: 'fas fa-database',
                color: 'text-geek-green'
            });
        }

        // 搜索测量名
        if (db.measurements) {
            db.measurements.forEach(measurement => {
                if (measurement.name.toLowerCase().includes(query)) {
                    results.push({
                        type: 'measurement',
                        name: measurement.name,
                        path: `${db.name} > ${measurement.name}`,
                        icon: 'fas fa-chart-line',
                        color: 'text-geek-orange',
                        database: db.name
                    });
                }

                // 搜索字段名
                if (measurement.fields) {
                    measurement.fields.forEach(field => {
                        if (field.name.toLowerCase().includes(query)) {
                            results.push({
                                type: 'field',
                                name: field,
                                path: `${db.name} > ${measurement.name} > ${field}`,
                                icon: 'fas fa-tag',
                                color: 'text-geek-cyan',
                                database: db.name,
                                measurement: measurement.name
                            });
                        }
                    });
                }

                // 搜索标签名
                if (measurement.tags) {
                    measurement.tags.forEach(tag => {
                        if (tag.name.toLowerCase().includes(query)) {
                            results.push({
                                type: 'tag',
                                name: tag,
                                path: `${db.name} > ${measurement.name} > ${tag}`,
                                icon: 'fas fa-hashtag',
                                color: 'text-geek-blue',
                                database: db.name,
                                measurement: measurement.name
                            });
                        }
                    });
                }
            });
        }
    });

    return results;
};

InfluxDBStudio.prototype.renderSearchResults = function (results, query) {
    const treeContainer = document.querySelector('.database-tree');

    if (results.length === 0) {
        treeContainer.innerHTML = `
            <div class="empty-state text-center py-8">
                <div class="empty-icon mb-4">
                    <i class="fas fa-search text-4xl text-geek-text-muted"></i>
                </div>
                <p class="text-geek-text-muted">未找到匹配项</p>
                <p class="text-sm text-geek-text-muted mt-1">尝试使用不同的关键词</p>
            </div>
        `;
        return;
    }

    let resultsHTML = `
        <div class="search-results">
            <div class="search-header mb-3 pb-2 border-b border-geek-border">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-geek-text-secondary">搜索结果</span>
                    <span class="text-xs text-geek-text-muted">${results.length} 项</span>
                </div>
                <div class="text-xs text-geek-text-muted mt-1">关键词: "${query}"</div>
            </div>
            <div class="search-items space-y-1">
    `;

    results.forEach(result => {
        const highlightedName = this.highlightSearchTerm(result.name, query);
        const highlightedPath = this.highlightSearchTerm(result.path, query);

        resultsHTML += `
            <div class="search-item p-2 hover:bg-geek-card rounded-lg cursor-pointer transition-all duration-200 group" 
                 onclick="app.selectSearchResult('${result.type}', '${result.name}', '${result.database || ''}', '${result.measurement || ''}')">
                <div class="flex items-center space-x-3">
                    <i class="${result.icon} ${result.color} text-sm"></i>
                    <div class="flex-1">
                        <div class="text-sm text-geek-text">${highlightedName}</div>
                        <div class="text-xs text-geek-text-muted">${highlightedPath}</div>
                    </div>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                        <span class="text-xs text-geek-text-muted bg-geek-darker px-2 py-1 rounded">${result.type}</span>
                    </div>
                </div>
            </div>
        `;
    });

    resultsHTML += `
            </div>
        </div>
    `;

    treeContainer.innerHTML = resultsHTML;
};

InfluxDBStudio.prototype.highlightSearchTerm = function (text, term) {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="bg-geek-green bg-opacity-20 text-geek-green px-1 rounded">$1</span>');
};

InfluxDBStudio.prototype.selectSearchResult = function (type, name, database, measurement) {
    let query = '';

    switch (type) {
        case 'database':
            query = `SHOW MEASUREMENTS ON "${name}"`;
            break;
        case 'measurement':
            query = `SELECT * FROM "${name}" LIMIT 10`;
            break;
        case 'field':
            query = `SELECT "${name}" FROM "${measurement}" LIMIT 10`;
            break;
        case 'tag':
            query = `SELECT * FROM "${measurement}" WHERE "${name}" != '' LIMIT 10`;
            break;
    }

    if (query) {
        this.setQueryText(query);
        this.showNotification(`已生成查询: ${type} "${name}"`, 'info');
    }

    // 清空搜索框
    const searchInput = document.querySelector('input[placeholder*="搜索"]');
    if (searchInput) {
        searchInput.value = '';
        this.renderDatabaseTree(); // 恢复完整树结构
    }
};

// 更新连接状态方法以支持新的UI
InfluxDBStudio.prototype.updateConnectionStatus = function () {
    // 更新连接选择器
    this.updateConnectionSelector();

    // 更新标题栏连接指示器
    const titleIndicator = document.querySelector('.connection-indicator .w-2');
    const titleText = document.querySelector('.connection-indicator span');

    if (titleIndicator && titleText) {
        if (this.isConnected) {
            titleIndicator.className = 'w-2 h-2 bg-geek-green rounded-full animate-pulse';
            titleText.textContent = '在线';
        } else {
            titleIndicator.className = 'w-2 h-2 bg-geek-red rounded-full animate-pulse';
            titleText.textContent = '离线';
        }
    }
};

// 增强模拟连接功能
InfluxDBStudio.prototype.simulateConnection = function () {
    if (this.currentConnection) {
        // 切换当前连接的状态
        this.currentConnection.status = this.currentConnection.status === 'connected' ? 'disconnected' : 'connected';
        this.isConnected = this.currentConnection.status === 'connected';
    } else {
        // 如果没有选择连接，自动选择第一个
        if (this.connections.length > 0) {
            this.currentConnection = this.connections[0];
            this.currentConnection.status = 'connected';
            this.isConnected = true;
        }
    }

    this.updateConnectionStatus();
    this.renderDatabaseTree();

    if (this.isConnected) {
        this.showNotification(`已连接到 ${this.currentConnection.name}`, 'success');
    } else {
        this.showNotification(`已断开 ${this.currentConnection.name}`, 'info');
    }
};

console.log('🔧 连接管理和搜索功能已加载');
console.log('✨ 新增功能:');
console.log('   - 统一连接选择器');
console.log('   - 智能搜索功能');
console.log('   - 搜索结果高亮');
console.log('   - 快速查询生成');
// 添加缺失的辅助方法来支持新的数据库树功能

// 格式化数字显示
InfluxDBStudio.prototype.formatNumber = function (num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

// 计算时间差
InfluxDBStudio.prototype.getTimeSince = function (date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return `${diffDays}天前`;
};

// 初始化展开节点状态
InfluxDBStudio.prototype.initExpandedNodes = function () {
    if (!this.expandedNodes) {
        this.expandedNodes = new Set();
    }
};

// 切换树节点展开/折叠状态
InfluxDBStudio.prototype.toggleTreeNode = function (toggleElement) {
    const isExpanded = toggleElement.classList.contains('rotate-90');
    const treeItem = toggleElement.closest('.tree-item');
    const children = treeItem.querySelector('.tree-children');

    if (!children) return;

    if (isExpanded) {
        toggleElement.classList.remove('rotate-90');
        children.classList.add('hidden');

        // 更新展开状态
        const itemId = treeItem.getAttribute('data-id');
        if (itemId) {
            this.expandedNodes?.delete(itemId);
        }
    } else {
        toggleElement.classList.add('rotate-90');
        children.classList.remove('hidden');

        // 更新展开状态
        const itemId = treeItem.getAttribute('data-id');
        if (itemId) {
            this.initExpandedNodes();
            this.expandedNodes.add(itemId);
        }
    }
};

// 快速查询功能
InfluxDBStudio.prototype.quickQuery = function (database, measurement) {
    const query = `SELECT * FROM "${measurement}" LIMIT 100`;
    this.setQueryText(query);
    this.showNotification(`已生成快速查询: ${measurement}`, 'info');
};

// 显示测量详情
InfluxDBStudio.prototype.showMeasurementDetails = function (database, measurementName) {
    const db = this.databaseStructure.databases.find(d => d.name === database);
    const measurement = db?.measurements.find(m => m.name === measurementName);

    if (!measurement) {
        this.showNotification('未找到测量信息', 'error');
        return;
    }

    const resultsContent = document.querySelector('.results-content');
    const detailsHTML = `
        <div class="measurement-details p-4">
            <div class="details-header mb-6">
                <div class="flex items-center space-x-3 mb-2">
                    <i class="fas fa-chart-line text-geek-orange text-xl"></i>
                    <div>
                        <h2 class="text-xl font-semibold text-geek-text">${measurement.name}</h2>
                        <p class="text-sm text-geek-text-muted">${measurement.description}</p>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mt-4">
                    <div class="stat-card bg-geek-card border border-geek-border rounded-lg p-3">
                        <div class="text-2xl font-bold text-geek-green">${this.formatNumber(measurement.pointCount)}</div>
                        <div class="text-sm text-geek-text-muted">数据点</div>
                    </div>
                    <div class="stat-card bg-geek-card border border-geek-border rounded-lg p-3">
                        <div class="text-2xl font-bold text-geek-cyan">${measurement.fields.length}</div>
                        <div class="text-sm text-geek-text-muted">字段</div>
                    </div>
                    <div class="stat-card bg-geek-card border border-geek-border rounded-lg p-3">
                        <div class="text-2xl font-bold text-geek-blue">${measurement.tags.length}</div>
                        <div class="text-sm text-geek-text-muted">标签</div>
                    </div>
                </div>
            </div>
            
            <div class="details-content grid grid-cols-2 gap-6">
                <!-- Fields -->
                <div class="fields-section">
                    <h3 class="text-lg font-semibold text-geek-text mb-3 flex items-center space-x-2">
                        <i class="fas fa-tag text-geek-cyan"></i>
                        <span>字段 (${measurement.fields.length})</span>
                    </h3>
                    <div class="space-y-2">
                        ${measurement.fields.map(field => `
                            <div class="field-item bg-geek-card border border-geek-border rounded-lg p-3 hover:border-geek-cyan transition-colors cursor-pointer" onclick="app.selectField('${database}', '${measurementName}', '${field.name}')">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-2">
                                        <i class="fas fa-hashtag text-geek-cyan text-sm"></i>
                                        <span class="font-medium text-geek-text">${field.name}</span>
                                    </div>
                                    <span class="text-xs bg-geek-darker text-geek-text-muted px-2 py-1 rounded">${field.type}</span>
                                </div>
                                <p class="text-sm text-geek-text-muted mt-1">${field.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Tags -->
                <div class="tags-section">
                    <h3 class="text-lg font-semibold text-geek-text mb-3 flex items-center space-x-2">
                        <i class="fas fa-tags text-geek-blue"></i>
                        <span>标签 (${measurement.tags.length})</span>
                    </h3>
                    <div class="space-y-2">
                        ${measurement.tags.map(tag => `
                            <div class="tag-item bg-geek-card border border-geek-border rounded-lg p-3 hover:border-geek-blue transition-colors cursor-pointer" onclick="app.selectTag('${database}', '${measurementName}', '${tag.name}')">
                                <div class="flex items-center space-x-2">
                                    <i class="fas fa-tag text-geek-blue text-sm"></i>
                                    <span class="font-medium text-geek-text">${tag.name}</span>
                                </div>
                                <p class="text-sm text-geek-text-muted mt-1">${tag.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <div class="details-actions mt-6 flex items-center space-x-3">
                <button class="btn-primary" onclick="app.quickQuery('${database}', '${measurementName}')">
                    <i class="fas fa-play mr-2"></i>
                    快速查询
                </button>
                <button class="btn-secondary" onclick="app.generateFluxQuery('${database}', '${measurementName}')">
                    <i class="fas fa-code mr-2"></i>
                    生成Flux查询
                </button>
                <button class="btn-secondary" onclick="app.showSchemaInfo('${database}', '${measurementName}')">
                    <i class="fas fa-info-circle mr-2"></i>
                    架构信息
                </button>
            </div>
        </div>
    `;

    resultsContent.innerHTML = detailsHTML;
    this.showNotification(`已显示 ${measurementName} 详情`, 'info');
};

// 选择字段
InfluxDBStudio.prototype.selectField = function (database, measurement, fieldName) {
    const query = `SELECT "${fieldName}" FROM "${measurement}" LIMIT 100`;
    this.setQueryText(query);
    this.showNotification(`已选择字段: ${fieldName}`, 'info');
};

// 选择标签
InfluxDBStudio.prototype.selectTag = function (database, measurement, tagName) {
    const query = `SELECT * FROM "${measurement}" WHERE "${tagName}" != '' GROUP BY "${tagName}" LIMIT 100`;
    this.setQueryText(query);
    this.showNotification(`已选择标签: ${tagName}`, 'info');
};

// 显示数据库菜单
InfluxDBStudio.prototype.showDatabaseMenu = function (databaseName) {
    // 创建上下文菜单
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
        position: fixed;
        background: var(--color-bg-card);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        min-width: 200px;
        padding: var(--spacing-xs);
    `;

    menu.innerHTML = `
        <div class="menu-item p-2 hover:bg-geek-darker rounded cursor-pointer transition-colors" onclick="app.showDatabaseInfo('${databaseName}')">
            <i class="fas fa-info-circle text-geek-blue mr-2"></i>
            数据库信息
        </div>
        <div class="menu-item p-2 hover:bg-geek-darker rounded cursor-pointer transition-colors" onclick="app.refreshDatabase('${databaseName}')">
            <i class="fas fa-sync-alt text-geek-green mr-2"></i>
            刷新结构
        </div>
        <div class="menu-item p-2 hover:bg-geek-darker rounded cursor-pointer transition-colors" onclick="app.exportDatabaseSchema('${databaseName}')">
            <i class="fas fa-download text-geek-cyan mr-2"></i>
            导出架构
        </div>
        <hr class="border-geek-border my-1">
        <div class="menu-item p-2 hover:bg-geek-darker rounded cursor-pointer transition-colors" onclick="app.createMeasurement('${databaseName}')">
            <i class="fas fa-plus text-geek-green mr-2"></i>
            创建测量
        </div>
    `;

    // 定位菜单
    const rect = event.target.getBoundingClientRect();
    menu.style.left = rect.right + 'px';
    menu.style.top = rect.top + 'px';

    document.body.appendChild(menu);

    // 点击外部关闭菜单
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };

    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
};

// 展开所有测量
InfluxDBStudio.prototype.expandAllMeasurements = function (databaseName) {
    const db = this.databaseStructure.databases.find(d => d.name === databaseName);
    if (!db) return;

    // 找到对应的测量容器并展开所有子项
    const measurementsContainer = document.querySelector(`[data-id*="${databaseName}"] .measurements .tree-children`);
    if (measurementsContainer) {
        const measurementItems = measurementsContainer.querySelectorAll('.measurement-item');
        measurementItems.forEach(item => {
            const toggle = item.querySelector('.tree-toggle');
            const children = item.querySelector('.tree-children');
            if (toggle && children && children.classList.contains('hidden')) {
                toggle.classList.add('rotate-90');
                children.classList.remove('hidden');
            }
        });
    }

    this.showNotification(`已展开 ${databaseName} 的所有测量`, 'info');
};

// 生成Flux查询
InfluxDBStudio.prototype.generateFluxQuery = function (database, measurement) {
    const fluxQuery = `from(bucket: "${database}")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "${measurement}")
  |> limit(n: 100)`;

    this.setQueryText(fluxQuery);
    this.showNotification(`已生成Flux查询: ${measurement}`, 'info');
};

// 显示架构信息
InfluxDBStudio.prototype.showSchemaInfo = function (database, measurementName) {
    const db = this.databaseStructure.databases.find(d => d.name === database);
    const measurement = db?.measurements.find(m => m.name === measurementName);

    if (!measurement) return;

    const schemaInfo = {
        measurement: measurementName,
        database: database,
        fields: measurement.fields.map(f => ({ name: f.name, type: f.type })),
        tags: measurement.tags.map(t => ({ name: t.name })),
        lastUpdate: measurement.lastUpdate,
        pointCount: measurement.pointCount
    };

    const resultsContent = document.querySelector('.results-content');
    resultsContent.innerHTML = `
        <div class="schema-info p-4">
            <h3 class="text-lg font-semibold text-geek-green mb-4">架构信息</h3>
            <pre class="json-output"><code>${JSON.stringify(schemaInfo, null, 2)}</code></pre>
        </div>
    `;

    this.showNotification('已显示架构信息', 'info');
};

// 更新查询编辑器
InfluxDBStudio.prototype.updateQueryEditor = function () {
    // 设置默认查询
    if (this.isConnected && this.databaseStructure.databases.length > 0) {
        const firstDb = this.databaseStructure.databases[0];
        const firstMeasurement = firstDb.measurements[0];
        if (firstMeasurement) {
            const defaultQuery = `SELECT * FROM "${firstMeasurement.name}" LIMIT 10`;
            this.setQueryText(defaultQuery);
        }
    }
};

// 初始化时调用
InfluxDBStudio.prototype.init = function () {
    this.initExpandedNodes();
    this.setupEventListeners();
    this.loadMockData();
    this.initializeUI();
};

console.log('🌳 数据库树增强功能已加载');
console.log('✨ 新增功能:');
console.log('   - 丰富的模拟数据结构');
console.log('   - 多层级树形展示');
console.log('   - 字段和标签详情');
console.log('   - 快速查询生成');
console.log('   - 测量详情面板');
console.log('   - 上下文菜单操作');