<template>
  <div class="sticky-table-wrapper" ref="wrapper">

    <!-- 列设置按钮 -->
    <div class="column-btn-wrapper">
      <button class="column-toggle-btn" @click.stop="toggleColumnMenu($event)">
        ⚙ 列设置
      </button>
    </div>

    <hr class="table-divider"/>

    <!-- 表头 -->
    <div class="sticky-table-header" ref="header">
      <table>
        <colgroup>
          <col style="width:60px;"/>
          <col v-for="(col,index) in displayedColumns" :key="col.prop"
               :style="{ width: col.width || (index===0?firstColWidth:defaultColWidth) }"/>
        </colgroup>
        <thead>
        <tr>
          <th class="index-column">
            <div class="th-content">序号</div>
          </th>
          <th v-for="(col,index) in displayedColumns" :key="col.prop" :class="{ 'first-column': index===0 }">
            <div class="th-content">
              <span @click.stop="toggleSort(col.prop)" style="display:flex;align-items:center;cursor:pointer;">
                {{ col.label }}
                <span class="sort-icons">
                  <span :class="{ active: sortColumn===col.prop && sortOrder==='asc' }">▲</span>
                  <span :class="{ active: sortColumn===col.prop && sortOrder==='desc' }">▼</span>
                </span>
              </span>
              <el-icon class="filter-wrapper" @click.stop="toggleFilter(col.prop,$event)">
                <ArrowDown :class="{ open: activeFilter===col.prop }"/>
              </el-icon>
              <div class="resizer" @mousedown="startResize($event,index)"></div>
            </div>
          </th>
        </tr>
        </thead>
      </table>
    </div>

    <!-- 表体 -->
    <div class="sticky-table-body" ref="body">
      <table>
        <colgroup>
          <col style="width:60px;"/>
          <col v-for="(col,index) in displayedColumns" :key="col.prop"
               :style="{ width: col.width || (index===0?firstColWidth:defaultColWidth) }"/>
        </colgroup>
        <tbody>
        <tr v-for="(row,rowIndex) in sortedData" :key="rowIndex"
            :class="{'row-selected': selectedRows.includes(rowIndex)}">
          <td class="index-column">
            <input type="checkbox" :checked="selectedRows.includes(rowIndex)" @change="toggleRow(rowIndex)"/>
            {{ rowIndex + 1 }}
          </td>
          <td v-for="(col,colIndex) in displayedColumns" :key="col.prop" :class="{ 'first-column': colIndex===0 }">
            {{ row[col.prop] }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- 列设置下拉菜单 -->
    <teleport to="body">
      <div v-if="showColumnMenu" class="column-menu" :style="menuStyle" @click.stop>
        <div class="column-options-scroll">
          <label v-for="col in columns" :key="col.prop" class="column-option">
            <input type="checkbox" v-model="tempVisibleColumns" :value="col.prop" :disabled="col.prop==='序号'"/>
            {{ col.label }}
          </label>
        </div>
        <div class="column-actions">
          <button class="btn-select" @click="selectAllColumns">全选</button>
          <button class="btn-deselect" @click="deselectAllColumns">全不选</button>
          <button class="btn-apply" @click="applyColumns">确定</button>
          <button class="btn-clear" @click="cancelColumns">取消</button>
        </div>
      </div>
    </teleport>

    <!-- 筛选下拉菜单 -->
    <teleport to="body">
      <div v-if="activeFilter" class="filter-dropdown" :style="dropdownStyle" @click.stop>
        <div class="filter-top">
          <template v-if="isNumberColumn(activeFilter)">
            <input type="number" v-model.number="minValue" placeholder="最小值" class="filter-input"/>
            <input type="number" v-model.number="maxValue" placeholder="最大值" class="filter-input"/>
          </template>
          <template v-else>
            <input type="text" v-model="filterSearch" placeholder="搜索..." class="filter-input"/>
          </template>
        </div>
        <div v-if="!isNumberColumn(activeFilter)" class="filter-options">
          <div v-for="value in filteredOptions(activeFilter)" :key="value" class="filter-option">
            <label>
              <input type="checkbox" :value="value" v-model="selectedValues"/>
              {{ value || '(空)' }}
            </label>
          </div>
        </div>
        <div class="filter-actions-bottom">
          <button class="btn-select" @click="selectAll">全选</button>
          <button class="btn-deselect" @click="deselectAll">全不选</button>
          <button class="btn-apply" @click="applyFilter">确定</button>
          <button class="btn-clear" @click="clearFilter">清除</button>
        </div>
      </div>
    </teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElIcon } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  columns: { type: Array, required: true },
  data: { type: Array, required: true },
  filters: { type: Object, default: () => ({}) },
  firstColWidth: { type: String, default: '150px' },
  defaultColWidth: { type: String, default: '120px' }
})
const emit = defineEmits(['update:filters'])

/* 状态 */
const activeFilter = ref(null)
const dropdownStyle = ref({})
const wrapper = ref(null)
const header = ref(null)
const body = ref(null)
const selectedValues = ref([])
const minValue = ref(null)
const maxValue = ref(null)
const sortColumn = ref(null)
const sortOrder = ref(null)
const numberFilters = ref({})
const filterSearch = ref('')
const showColumnMenu = ref(false)
const menuStyle = ref({top: '0px', left: '0px'})
const visibleColumns = ref([])
const tempVisibleColumns = ref([])
const selectedRows = ref([])

/* 初始化 */
onMounted(() => {
  visibleColumns.value = props.columns.map(c => c.prop)
  if (body.value && header.value) {
    body.value.addEventListener('scroll', () => {
      header.value.scrollLeft = body.value.scrollLeft
    })
  }
  window.addEventListener('click', () => {
    showColumnMenu.value = false
    activeFilter.value = null
  })
})

const displayedColumns = computed(() => props.columns.filter(c => visibleColumns.value.includes(c.prop)))
const isNumberColumn = colKey => props.columns.find(c => c.prop === colKey)?.type === 'number'

/* 选择行 */
const toggleRow = rowIndex => {
  if (selectedRows.value.includes(rowIndex)) selectedRows.value = selectedRows.value.filter(i => i !== rowIndex)
  else selectedRows.value.push(rowIndex)
}

/* 排序与筛选逻辑保持和之前相同 */
const filteredData = computed(()=>props.data.filter(row=>{
  return Object.keys(props.filters).every(colKey=>{
    const vals = props.filters[colKey]||[]
    if(vals.length && !vals.includes(row[colKey])) return false
    const numFilter = numberFilters.value[colKey]
    if(numFilter){
      const v = Number(row[colKey])
      if(numFilter.min != null && v < numFilter.min) return false
      if(numFilter.max != null && v > numFilter.max) return false
    }
    return true
  })
}))
const sortedData = computed(()=>{
  if(!sortColumn.value || !sortOrder.value) return filteredData.value
  return [...filteredData.value].sort((a,b)=>{
    const valA = a[sortColumn.value] ?? ''
    const valB = b[sortColumn.value] ?? ''
    if(valA<valB) return sortOrder.value==='asc'? -1:1
    if(valA>valB) return sortOrder.value==='asc'? 1:-1
    return 0
  })
})
const getUniqueValues = colKey => [...new Set(sortedData.value.map(r=>r[colKey]))]
const filteredOptions = colKey => {
  const options = getUniqueValues(colKey)
  if(!filterSearch.value) return options
  const search = filterSearch.value.toLowerCase()
  return options.filter(v=>String(v??'').toLowerCase().includes(search))
}

/* 排序/筛选操作保持原逻辑 */
const toggleSort = colKey=>{
  if(sortColumn.value!==colKey){ sortColumn.value=colKey; sortOrder.value='asc'}
  else if(sortOrder.value==='asc') sortOrder.value='desc'
  else if(sortOrder.value==='desc'){ sortColumn.value=null; sortOrder.value=null }
  else sortOrder.value='asc'
}
watch(activeFilter, val=>{ if(val && body.value) body.value.style.overflowX='hidden'; else if(body.value) body.value.style.overflowX='auto'; filterSearch.value='' })
const toggleFilter = (colKey,event)=>{
  if(activeFilter.value===colKey){ activeFilter.value=null; return }
  activeFilter.value = colKey
  selectedValues.value = Array.isArray(props.filters[colKey])?[...props.filters[colKey]]:[]
  if(isNumberColumn(colKey)){ const f=numberFilters.value[colKey]||{}; minValue.value=f.min??null; maxValue.value=f.max??null }
  const rect = event.target.getBoundingClientRect()
  const dropdownWidth = 250
  let left = rect.left
  if(left+dropdownWidth>window.innerWidth) left=window.innerWidth-dropdownWidth-8
  dropdownStyle.value={position:'fixed', top:rect.bottom+'px', left:left+'px'}
}
const applyFilter = ()=>{ const newFilters={...props.filters}; if(isNumberColumn(activeFilter.value)) numberFilters.value[activeFilter.value]={min:minValue.value,max:maxValue.value}; else newFilters[activeFilter.value]=[...selectedValues.value]; emit('update:filters',newFilters); activeFilter.value=null; filterSearch.value=''}
const clearFilter = ()=>{ const newFilters={...props.filters}; delete newFilters[activeFilter.value]; if(isNumberColumn(activeFilter.value)) delete numberFilters.value[activeFilter.value]; emit('update:filters',newFilters); activeFilter.value=null; filterSearch.value='' }
const selectAll=()=>{ selectedValues.value = getUniqueValues(activeFilter.value) }
const deselectAll=()=>{ selectedValues.value = [] }

/* 列设置 */
const toggleColumnMenu = event=>{ if(!event) return; showColumnMenu.value=!showColumnMenu.value; if(showColumnMenu.value){ const rect = event.target.getBoundingClientRect(); let left=rect.left; if(left+220>window.innerWidth) left=window.innerWidth-228; menuStyle.value={position:'fixed',top:rect.bottom+'px',left:left+'px',zIndex:10000}; tempVisibleColumns.value=[...visibleColumns.value] } }
const selectAllColumns=()=>{ tempVisibleColumns.value=props.columns.map(c=>c.prop) }
const deselectAllColumns=()=>{ tempVisibleColumns.value=props.columns.filter(c=>c.prop==='序号').map(c=>c.prop) }
const applyColumns=()=>{ visibleColumns.value=[...tempVisibleColumns.value]; showColumnMenu.value=false }
const cancelColumns=()=>{ showColumnMenu.value=false }

/* 列宽拖拽 */
const startResize=(e,colIndex)=>{
  e.preventDefault()
  const startX = e.clientX
  const col = props.columns[colIndex]
  const startWidth = parseInt(col.width||(colIndex===0?props.firstColWidth:props.defaultColWidth))
  const mouseMoveHandler=(ev)=>{ const diff = ev.clientX-startX; const newWidth=startWidth+diff; if(newWidth>30) col.width=newWidth+'px'}
  const mouseUpHandler=()=>{ document.removeEventListener('mousemove',mouseMoveHandler); document.removeEventListener('mouseup',mouseUpHandler)}
  document.addEventListener('mousemove',mouseMoveHandler)
  document.addEventListener('mouseup',mouseUpHandler)
}
</script>


<style scoped>

/* 样式同之前版本保持 */
.column-btn-wrapper {
  position: relative;
  margin-bottom: 4px;
  display: flex;
  justify-content: flex-end;
}

.column-toggle-btn {
  background: #409eff;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 2px;
  margin-right: 20px; /* 按钮右边距 */
  cursor: pointer;
}
.column-toggle-btn:hover {
  background-color: #66b1ff; /* 悬停高亮颜色 */
}

.table-divider {
  margin: 0 0 4px 0;
  border: 1px solid #ddd;
}

.column-menu {
  background: #fff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  max-height: 250px;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  z-index: 10000;
}

.column-options-scroll {
  overflow-y: auto;
  flex: 1;
  padding: 4px 6px;
}

.column-option {
  display: block;
  margin: 2px 0;
}

.column-actions {
  display: flex;
  justify-content: space-between;
  padding: 4px 6px;
  border-top: 1px solid #ddd;
  background: #fff;
}

.column-actions button {
  padding: 2px 6px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
}

.btn-select {
  background: #409eff;
  color: #fff;
}

.btn-deselect {
  background: #67c23a;
  color: #fff;
}

.btn-apply {
  background: #f56c6c;
  color: #fff;
}

.btn-clear {
  background: #909399;
  color: #fff;
}

.column-actions button:hover {
  opacity: 0.85;
}

.sticky-table-wrapper {
  position: relative;
  overflow: hidden;
  max-height: 100vh;
  font-family: "Arial", "Helvetica", sans-serif;
}

.sticky-table-header {
  overflow: hidden;
  position: relative;
}

.sticky-table-header table, .sticky-table-body table {
  border-collapse: collapse;
  width: max-content;
  table-layout: auto;
}

.sticky-table-header th {
  position: sticky;
  top: 0;
  background: #f5f7fa;
  z-index: 10;
  border: 1px solid #e0e0e0;
  text-align: center;
  vertical-align: middle;
  font-weight: 600;
  font-size: 14px;
}

.sticky-table-header th.index-column {
  position: sticky;
  left: 0;
  z-index: 30;
  background: #f5f7fa;
}

.sticky-table-header th.first-column {
  position: sticky;
  left: 60px;
  z-index: 25;
  background: #f5f7fa;
}

.sticky-table-body {
  overflow: auto;
  max-height: 70vh;
}

.sticky-table-body td {
  border: 1px solid #e0e0e0;
  text-align: center;
  vertical-align: middle;
  font-size: 13px;
}

.index-column {
  position: sticky;
  left: 0;
  z-index: 20;
  background: #f5f7fa;
  font-weight: 600;
  font-size: 14px;
  width: 60px;
}

.sticky-table-body td.first-column {
  position: sticky;
  left: 60px;
  z-index: 10;
  background: #f5f7fa;
  font-weight: 500;
  font-size: 14px;
}

.sticky-table-body tr:hover td {
  background-color: #e6f7ff;
}

.sticky-table-body tr:hover td.index-column {
  background-color: #d6ecff;
}

.th-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.filter-wrapper {
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.filter-wrapper svg {
  width: 14px;
  height: 14px;
  transition: transform 0.3s;
}

.filter-wrapper svg.open {
  transform: rotate(180deg);
}

.resizer {
  position: absolute;
  right: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
}

.sort-icons {
  display: inline-flex;
  flex-direction: column;
  font-size: 10px;
  margin-left: 2px;
}

.sort-icons span {
  color: #ccc;
  line-height: 10px;
}

.sort-icons span.active {
  color: #1890ff;
  font-weight: bold;
}

.filter-dropdown {
  background: #fff;
  border: 1px solid #ddd;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 180px;
  max-height: 250px;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  overflow: hidden;
}

.filter-top {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
  justify-content: center;
}

.filter-input {
  width: 160px;
  padding: 2px 4px;
  font-size: 13px;
  border: 1px solid #ccc;
  border-radius: 2px;
}

.filter-options {
  overflow-y: auto;
  max-height: 160px;
  border-top: 1px solid #ddd;
  padding: 2px 4px;
}

.filter-option {
  padding: 2px 4px;
  display: flex;
  align-items: center;
}

.filter-actions-bottom button {
  padding: 2px 6px;
  border-radius: 2px;
  border: none;
  cursor: pointer;
}

.filter-actions-bottom {
  display: flex;
  gap: 2px;
  padding: 4px 2px;
  border-top: 1px solid #ddd;
  justify-content: space-between;
}

/* 行选中高亮 */
/* 勾选行高亮 */
.row-selected td {
  background-color: #e6f7ff !important; /* 强制覆盖 */
}

.sticky-table-body tr:hover td {
  background-color: #bae7ff;
}

.sticky-table-body tr:hover td.index-column {
  background-color: #b7d5ed;
}
</style>