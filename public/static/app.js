/**
 * 워드프레스 마케팅 자동화 대시보드 - Frontend
 */

// 전역 상태
const state = {
  clients: [],
  selectedClient: null,
  contents: [],
  currentView: 'dashboard', // dashboard, clients, contents, generate, customize
};

// API 기본 경로
const API_BASE = '/api';

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  loadClients();
});

// 앱 렌더링
function renderApp() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen bg-gray-100">
      <!-- 헤더 -->
      <header class="bg-white shadow-md">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-gray-900">
              <i class="fas fa-rocket text-blue-500 mr-2"></i>
              워드프레스 마케팅 자동화
            </h1>
            <nav class="flex space-x-4">
              <button onclick="setView('dashboard')" class="px-4 py-2 rounded hover:bg-gray-100" id="nav-dashboard">
                <i class="fas fa-home mr-2"></i>대시보드
              </button>
              <button onclick="setView('clients')" class="px-4 py-2 rounded hover:bg-gray-100" id="nav-clients">
                <i class="fas fa-building mr-2"></i>업체 관리
              </button>
              <button onclick="setView('contents')" class="px-4 py-2 rounded hover:bg-gray-100" id="nav-contents">
                <i class="fas fa-file-alt mr-2"></i>콘텐츠
              </button>
              <button onclick="setView('generate')" class="px-4 py-2 rounded hover:bg-gray-100 bg-blue-500 text-white" id="nav-generate">
                <i class="fas fa-magic mr-2"></i>AI 생성
              </button>
              <button onclick="setView('customize')" class="px-4 py-2 rounded hover:bg-gray-100" id="nav-customize">
                <i class="fas fa-paint-brush mr-2"></i>블로그 꾸미기
              </button>
            </nav>
          </div>
        </div>
      </header>

      <!-- 메인 컨텐츠 -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div id="main-content"></div>
      </main>
    </div>
  `;

  updateView();
}

// 뷰 변경
function setView(view) {
  state.currentView = view;
  updateView();
}

// 뷰 업데이트
function updateView() {
  // 네비게이션 활성화 상태 업데이트
  document.querySelectorAll('nav button').forEach(btn => {
    btn.classList.remove('bg-blue-500', 'text-white');
    btn.classList.add('hover:bg-gray-100');
  });
  
  const activeBtn = document.getElementById(`nav-${state.currentView}`);
  if (activeBtn) {
    activeBtn.classList.add('bg-blue-500', 'text-white');
    activeBtn.classList.remove('hover:bg-gray-100');
  }

  const content = document.getElementById('main-content');
  
  switch (state.currentView) {
    case 'dashboard':
      renderDashboard(content);
      break;
    case 'clients':
      renderClients(content);
      break;
    case 'contents':
      renderContents(content);
      break;
    case 'generate':
      renderGenerate(content);
      break;
    case 'customize':
      renderCustomize(content);
      break;
  }
}

// 대시보드 렌더링
function renderDashboard(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">전체 업체</p>
            <p class="text-3xl font-bold text-gray-900" id="stat-clients">0</p>
          </div>
          <i class="fas fa-building text-4xl text-blue-500"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">총 콘텐츠</p>
            <p class="text-3xl font-bold text-gray-900" id="stat-contents">0</p>
          </div>
          <i class="fas fa-file-alt text-4xl text-green-500"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">발행 완료</p>
            <p class="text-3xl font-bold text-gray-900" id="stat-published">0</p>
          </div>
          <i class="fas fa-check-circle text-4xl text-purple-500"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">예약 대기</p>
            <p class="text-3xl font-bold text-gray-900" id="stat-scheduled">0</p>
          </div>
          <i class="fas fa-clock text-4xl text-orange-500"></i>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-bold mb-4">
        <i class="fas fa-chart-line mr-2"></i>빠른 시작
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onclick="setView('clients')" class="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition">
          <i class="fas fa-plus-circle text-3xl text-blue-500 mb-2"></i>
          <p class="font-semibold">새 업체 등록</p>
          <p class="text-sm text-gray-500">워드프레스 사이트 연결</p>
        </button>
        
        <button onclick="setView('generate')" class="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition">
          <i class="fas fa-magic text-3xl text-green-500 mb-2"></i>
          <p class="font-semibold">AI 콘텐츠 생성</p>
          <p class="text-sm text-gray-500">자동으로 글 작성하기</p>
        </button>
        
        <button onclick="setView('contents')" class="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition">
          <i class="fas fa-list text-3xl text-purple-500 mb-2"></i>
          <p class="font-semibold">콘텐츠 관리</p>
          <p class="text-sm text-gray-500">작성된 글 확인하기</p>
        </button>
      </div>
    </div>
  `;

  loadDashboardStats();
}

// 대시보드 통계 로드
async function loadDashboardStats() {
  try {
    const [clientsRes, contentsRes] = await Promise.all([
      axios.get(`${API_BASE}/clients`),
      axios.get(`${API_BASE}/contents`)
    ]);

    document.getElementById('stat-clients').textContent = clientsRes.data.data.length;
    document.getElementById('stat-contents').textContent = contentsRes.data.data.length;
    
    const published = contentsRes.data.data.filter(c => c.status === 'published').length;
    const scheduled = contentsRes.data.data.filter(c => c.status === 'scheduled').length;
    
    document.getElementById('stat-published').textContent = published;
    document.getElementById('stat-scheduled').textContent = scheduled;
  } catch (error) {
    console.error('통계 로드 실패:', error);
  }
}

// 업체 목록 로드
async function loadClients() {
  try {
    const response = await axios.get(`${API_BASE}/clients`);
    state.clients = response.data.data;
  } catch (error) {
    console.error('업체 목록 로드 실패:', error);
    showNotification('업체 목록을 불러오는데 실패했습니다', 'error');
  }
}

// 업체 관리 렌더링
async function renderClients(container) {
  // 로딩 표시
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">
          <i class="fas fa-building mr-2"></i>업체 관리
        </h2>
        <button onclick="showAddClientModal()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          <i class="fas fa-plus mr-2"></i>새 업체 등록
        </button>
      </div>
      <div id="clients-list" class="space-y-4">
        <p class="text-gray-500 text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>업체 목록을 불러오는 중...</p>
      </div>
    </div>
  `;

  // 최신 데이터 로드
  try {
    const response = await axios.get(`${API_BASE}/clients`);
    state.clients = response.data.data || [];
  } catch (error) {
    console.error('업체 목록 로드 실패:', error);
    document.getElementById('clients-list').innerHTML = '<p class="text-red-500 text-center py-8">업체 목록을 불러오는데 실패했습니다</p>';
    return;
  }

  // 업체 목록 렌더링
  const clientsList = document.getElementById('clients-list');
  if (state.clients.length === 0) {
    clientsList.innerHTML = '<p class="text-gray-500 text-center py-8">등록된 업체가 없습니다</p>';
  } else {
    clientsList.innerHTML = state.clients.map(client => `
      <div class="border rounded-lg p-4 hover:shadow-md transition">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold">${client.name}</h3>
            <p class="text-gray-600 text-sm">${client.wordpress_url}</p>
            <p class="text-gray-500 text-sm mt-2">${client.description || '설명 없음'}</p>
            <div class="mt-2 flex flex-wrap gap-2">
              <span class="inline-block px-2 py-1 rounded text-xs ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                ${client.is_active ? '활성' : '비활성'}
              </span>
              ${client.openai_api_key ? '<span class="inline-block px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">OpenAI</span>' : ''}
              ${client.gemini_api_key ? '<span class="inline-block px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">Gemini</span>' : ''}
              ${client.auto_publish ? '<span class="inline-block px-2 py-1 rounded text-xs bg-orange-100 text-orange-800"><i class="fas fa-clock mr-1"></i>자동발행</span>' : ''}
              ${client.business_type ? '<span class="inline-block px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">' + client.business_type + '</span>' : ''}
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="viewClientStats(${client.id})" class="text-blue-500 hover:text-blue-700" title="통계">
              <i class="fas fa-chart-bar"></i>
            </button>
            <button onclick="editClient(${client.id})" class="text-green-500 hover:text-green-700" title="수정">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteClient(${client.id})" class="text-red-500 hover:text-red-700" title="삭제">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // 기존 모달 제거 후 새로 추가
  const existingModal = document.getElementById('add-client-modal');
  if (existingModal) existingModal.remove();

  // 업체 등록 모달 추가
  const modalHtml = `
    <div id="add-client-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">새 업체 등록</h3>
        <form id="add-client-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">업체명 *</label>
            <input type="text" name="name" required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">업종</label>
            <select name="business_type" class="w-full border rounded px-3 py-2">
              <option value="">선택하세요</option>
              <option value="beauty">미용실/헤어살롱</option>
              <option value="restaurant">음식점/카페</option>
              <option value="medical">병원/의료</option>
              <option value="fitness">피트니스/헬스</option>
              <option value="education">교육/학원</option>
              <option value="insurance">보험/금융</option>
              <option value="realestate">부동산</option>
              <option value="legal">법률/세무</option>
              <option value="it">IT/기술</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">설명</label>
            <textarea name="description" rows="2" class="w-full border rounded px-3 py-2"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">워드프레스 URL *</label>
            <input type="url" name="wordpress_url" required placeholder="https://example.com" class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">워드프레스 사용자명 *</label>
            <input type="text" name="wordpress_username" required class="w-full border rounded px-3 py-2">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Application Password *</label>
            <input type="password" name="wordpress_password" required class="w-full border rounded px-3 py-2">
            <p class="text-xs text-gray-500 mt-1">워드프레스 관리자 → 사용자 → 프로필에서 생성</p>
          </div>
          
          <!-- API Keys 섹션 -->
          <div class="border-t pt-4 mt-4">
            <h4 class="font-medium mb-3 text-purple-700"><i class="fas fa-key mr-2"></i>AI API 설정</h4>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium mb-1">OpenAI API Key</label>
                <input type="password" name="openai_api_key" class="w-full border rounded px-3 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Gemini API Key</label>
                <input type="password" name="gemini_api_key" class="w-full border rounded px-3 py-2">
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">시스템 프롬프트 (AI 작성 지침)</label>
            <textarea name="system_prompt" rows="3" class="w-full border rounded px-3 py-2" placeholder="AI가 콘텐츠를 생성할 때 따를 지침을 입력하세요..."></textarea>
            <p class="text-xs text-yellow-600 mt-1">💡 SEO, AEO, C-RANK, GEO 최적화 등 원하는 전략을 입력하세요</p>
          </div>
          
          <!-- 자동 발행 설정 -->
          <div class="border-t pt-4 mt-4">
            <h4 class="font-medium mb-3 text-blue-700"><i class="fas fa-clock mr-2"></i>자동 발행 설정</h4>
            <div class="flex items-center mb-3">
              <input type="checkbox" name="auto_publish" id="auto_publish" class="mr-2 w-4 h-4">
              <label for="auto_publish" class="text-sm">자동 발행 활성화</label>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">발행 시간</label>
                <input type="time" name="publish_time" value="09:00" class="w-full border rounded px-3 py-2">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">발행 빈도</label>
                <select name="publish_frequency" class="w-full border rounded px-3 py-2">
                  <option value="daily">매일</option>
                  <option value="weekdays">평일만</option>
                  <option value="weekly">매주</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-2 pt-4">
            <button type="button" onclick="hideAddClientModal()" class="px-4 py-2 border rounded hover:bg-gray-100">취소</button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"><i class="fas fa-save mr-2"></i>저장</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // DOM에 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // 폼 제출 핸들러
  document.getElementById('add-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
      await axios.post(`${API_BASE}/clients`, data);
      showNotification('업체가 등록되었습니다', 'success');
      hideAddClientModal();
      await loadClients();
      updateView();
    } catch (error) {
      showNotification(error.response?.data?.error || '업체 등록에 실패했습니다', 'error');
    }
  });
}

// 콘텐츠 목록 렌더링
function renderContents(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-file-alt mr-2"></i>콘텐츠 관리
      </h2>
      <div id="contents-list">
        <p class="text-gray-500 text-center py-8">콘텐츠를 불러오는 중...</p>
      </div>
    </div>
  `;

  loadContents();
}

// 콘텐츠 목록 로드
async function loadContents() {
  try {
    const response = await axios.get(`${API_BASE}/contents`);
    state.contents = response.data.data;
    
    const container = document.getElementById('contents-list');
    if (state.contents.length === 0) {
      container.innerHTML = '<p class="text-gray-500 text-center py-8">작성된 콘텐츠가 없습니다</p>';
      return;
    }

    container.innerHTML = state.contents.map(content => `
      <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="text-lg font-semibold">${content.title}</h3>
            <p class="text-gray-600 text-sm mt-1">${content.excerpt || ''}</p>
            <div class="mt-2 flex items-center space-x-2">
              <span class="px-2 py-1 rounded text-xs ${getStatusColor(content.status)}">
                ${getStatusText(content.status)}
              </span>
              <span class="text-xs text-gray-500">${new Date(content.created_at).toLocaleString('ko-KR')}</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="previewContent(${content.id})" class="text-blue-500 hover:text-blue-700" title="미리보기">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="downloadContentTxt(${content.id})" class="text-purple-500 hover:text-purple-700" title="TXT 다운로드">
              <i class="fas fa-file-alt"></i>
            </button>
            <button onclick="downloadContentPdf(${content.id})" class="text-red-500 hover:text-red-700" title="PDF 다운로드">
              <i class="fas fa-file-pdf"></i>
            </button>
            ${content.status === 'draft' ? `
              <button onclick="publishContent(${content.id})" class="text-green-500 hover:text-green-700" title="워드프레스에 발행">
                <i class="fas fa-paper-plane"></i>
              </button>
            ` : ''}
            ${content.wordpress_post_id ? `
              <a href="#" class="text-blue-500 hover:text-blue-700" title="워드프레스에서 보기">
                <i class="fas fa-external-link-alt"></i>
              </a>
            ` : ''}
            <button onclick="deleteContent(${content.id})" class="text-red-500 hover:text-red-700" title="삭제">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('콘텐츠 로드 실패:', error);
    document.getElementById('contents-list').innerHTML = 
      '<p class="text-red-500 text-center py-8">콘텐츠를 불러오는데 실패했습니다</p>';
  }
}

// AI 생성 페이지 렌더링
function renderGenerate(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-magic mr-2"></i>AI 콘텐츠 생성
      </h2>
      
      <form id="generate-form" class="space-y-6">
        <div>
          <label class="block text-sm font-medium mb-2">업체 선택 *</label>
          <select name="client_id" required class="w-full border rounded px-3 py-2">
            <option value="">업체를 선택하세요</option>
            ${state.clients.filter(c => c.openai_api_key || c.gemini_api_key).map(client => `
              <option value="${client.id}">${client.name} ${client.gemini_api_key ? '(Gemini)' : ''} ${client.openai_api_key ? '(OpenAI)' : ''}</option>
            `).join('')}
          </select>
          <p class="text-xs text-gray-500 mt-1">API Key가 설정된 업체만 표시됩니다</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">키워드 *</label>
          <input type="text" name="keywords" required placeholder="예: SEO, 마케팅, 블로그 (쉼표로 구분)" class="w-full border rounded px-3 py-2">
          <p class="text-xs text-gray-500 mt-1">여러 키워드를 쉼표(,)로 구분하여 입력하세요</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">제목 (선택)</label>
          <input type="text" name="title" placeholder="비워두면 AI가 자동으로 생성합니다" class="w-full border rounded px-3 py-2">
        </div>

        <!-- 이미지 생성 섹션 -->
        <div class="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
          <div class="flex items-center mb-3">
            <input type="checkbox" name="generate_image" id="generate_image" class="mr-3 w-5 h-5 text-blue-600">
            <label for="generate_image" class="text-base font-semibold text-blue-900">
              <i class="fas fa-image mr-2"></i>DALL-E 3로 썸네일 이미지 생성
            </label>
          </div>
          
          <div id="image-prompt-container" class="hidden">
            <label class="block text-sm font-medium mb-2 text-blue-900">
              <i class="fas fa-palette mr-1"></i>이미지 생성 프롬프트 (영문 권장)
            </label>
            <input type="text" name="image_prompt" placeholder="예: Professional modern office workspace with laptop and coffee" class="w-full border-2 border-blue-300 rounded px-3 py-2 focus:border-blue-500 focus:outline-none">
            <p class="text-xs text-blue-700 mt-1">
              ■ 구체적으로 작성할수록 좋은 이미지가 생성됩니다
            </p>
          </div>
        </div>

        <div class="flex justify-end space-x-2">
          <button type="button" onclick="setView('dashboard')" class="px-6 py-2 border rounded hover:bg-gray-100">취소</button>
          <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            <i class="fas fa-magic mr-2"></i>생성하기
          </button>
        </div>
      </form>

      <div id="generation-result" class="hidden mt-6 p-4 bg-green-50 border border-green-200 rounded">
        <p class="text-green-800 font-semibold">콘텐츠가 생성되었습니다!</p>
        <button onclick="setView('contents')" class="mt-2 text-blue-500 hover:underline">콘텐츠 목록에서 확인하기</button>
      </div>
    </div>
  `;

  // 이미지 생성 체크박스 핸들러
  document.getElementById('generate_image').addEventListener('change', (e) => {
    document.getElementById('image-prompt-container').classList.toggle('hidden', !e.target.checked);
  });

  // 폼 제출 핸들러
  document.getElementById('generate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      client_id: parseInt(formData.get('client_id')),
      keywords: formData.get('keywords').split(',').map(k => k.trim()),
      title: formData.get('title') || undefined,
      generate_image: formData.get('generate_image') === 'on',
      image_prompt: formData.get('image_prompt') || undefined,
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중...';

    try {
      await axios.post(`${API_BASE}/contents/generate`, data);
      document.getElementById('generation-result').classList.remove('hidden');
      e.target.reset();
      showNotification('AI 콘텐츠가 생성되었습니다!', 'success');
    } catch (error) {
      showNotification(error.response?.data?.error || '콘텐츠 생성에 실패했습니다', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>생성하기';
    }
  });
}

// 유틸리티 함수들
function showAddClientModal() {
  document.getElementById('add-client-modal').classList.remove('hidden');
}

function hideAddClientModal() {
  document.getElementById('add-client-modal').classList.add('hidden');
}

function getStatusColor(status) {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || colors.draft;
}

function getStatusText(status) {
  const texts = {
    draft: '임시저장',
    scheduled: '예약됨',
    published: '발행완료',
    failed: '실패',
  };
  return texts[status] || status;
}

async function publishContent(id) {
  if (!confirm('이 콘텐츠를 워드프레스에 발행하시겠습니까?')) return;

  try {
    // 개발 환경 감지: localhost 또는 sandbox URL
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname.includes('sandbox') ||
                          window.location.hostname.includes('127.0.0.1');
    
    // 시뮬레이션 모드 사용 (개발 환경)
    const url = isDevelopment 
      ? `${API_BASE}/contents/${id}/publish?simulation=true`
      : `${API_BASE}/contents/${id}/publish`;
    
    const response = await axios.post(url);
    
    if (response.data.data?.simulation) {
      showNotification('✅ 시뮬레이션 모드: DB 상태가 "발행완료"로 변경되었습니다\n(실제 워드프레스 발행은 프로덕션 환경에서만 작동합니다)', 'success');
    } else {
      showNotification('콘텐츠가 워드프레스에 발행되었습니다!', 'success');
    }
    
    loadContents();
  } catch (error) {
    showNotification(error.response?.data?.error || '발행에 실패했습니다', 'error');
  }
}

function previewContent(id) {
  const content = state.contents.find(c => c.id === id);
  if (!content) return;

  const modalHtml = `
    <div id="preview-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div class="p-6 border-b flex justify-between items-center">
          <h3 class="text-xl font-bold">${content.title}</h3>
          <button onclick="hidePreviewModal()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="p-6 overflow-y-auto flex-1">
          <div class="prose max-w-none">
            ${content.content}
          </div>
        </div>
        <div class="p-6 border-t flex justify-between items-center">
          <div class="text-sm text-gray-500">
            <span class="px-2 py-1 rounded ${getStatusColor(content.status)}">${getStatusText(content.status)}</span>
            <span class="ml-4">${new Date(content.created_at).toLocaleString('ko-KR')}</span>
          </div>
          <div class="flex space-x-2">
            <button onclick="downloadContentTxt(${content.id})" class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              <i class="fas fa-file-alt mr-2"></i>TXT
            </button>
            <button onclick="downloadContentPdf(${content.id})" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              <i class="fas fa-file-pdf mr-2"></i>PDF
            </button>
            ${content.status === 'draft' ? `
              <button onclick="publishContent(${content.id}); hidePreviewModal();" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                워드프레스 발행
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function hidePreviewModal() {
  const modal = document.getElementById('preview-modal');
  if (modal) modal.remove();
}

function downloadContentTxt(id) {
  const content = state.contents.find(c => c.id === id);
  if (!content) return;

  const plainText = content.content.replace(/<[^>]*>/g, '\n').replace(/\n\n+/g, '\n\n').trim();
  
  const txtContent = `${content.title}\n${'='.repeat(content.title.length)}\n\n${plainText}\n\n---\n생성일시: ${new Date(content.created_at).toLocaleString('ko-KR')}\n상태: ${getStatusText(content.status)}`;

  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${content.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('TXT 파일이 다운로드되었습니다', 'success');
}

function downloadContentPdf(id) {
  const content = state.contents.find(c => c.id === id);
  if (!content) return;

  try {
    // jsPDF 사용
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // 한글 폰트 설정이 없으므로 기본 폰트 사용
    // 실제로는 Nanum Gothic 등을 base64로 embed해야 함
    doc.setFont('helvetica');
    doc.setFontSize(16);
    
    // 제목
    const title = content.title;
    doc.text(title, 20, 20, { maxWidth: 170 });
    
    // 구분선
    doc.setLineWidth(0.5);
    doc.line(20, 30, 190, 30);
    
    // 본문 (HTML 태그 제거)
    doc.setFontSize(11);
    const plainText = content.content
      .replace(/<h[1-6][^>]*>/gi, '\n\n')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\n\n+/g, '\n\n')
      .trim();
    
    // 텍스트 분할 (A4 페이지에 맞게)
    const lines = doc.splitTextToSize(plainText, 170);
    let y = 40;
    const lineHeight = 7;
    const pageHeight = 280;
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight) {
        doc.addPage();
        y = 20;
      }
      doc.text(lines[i], 20, y);
      y += lineHeight;
    }
    
    // 푸터
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(`생성일시: ${new Date(content.created_at).toLocaleString('ko-KR')}`, 20, y + 10);
    doc.text(`상태: ${getStatusText(content.status)}`, 20, y + 15);
    
    // PDF 저장
    const filename = `${content.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}.pdf`;
    doc.save(filename);
    
    showNotification('PDF 파일이 다운로드되었습니다', 'success');
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    showNotification('PDF 생성에 실패했습니다. 브라우저를 새로고침 후 다시 시도해주세요.', 'error');
  }
}

async function deleteContent(id) {
  if (!confirm('이 콘텐츠를 삭제하시겠습니까?')) return;

  try {
    await axios.delete(`${API_BASE}/contents/${id}`);
    showNotification('콘텐츠가 삭제되었습니다', 'success');
    loadContents();
  } catch (error) {
    showNotification('삭제에 실패했습니다', 'error');
  }
}

async function editClient(id) {
  const client = state.clients.find(c => c.id === id);
  if (!client) return;

  // 수정 모달 생성
  const modalHtml = `
    <div id="edit-client-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">업체 정보 수정</h3>
        <form id="edit-client-form" class="space-y-4">
          <input type="hidden" name="id" value="${client.id}">
          
          <div>
            <label class="block text-sm font-medium mb-1">업체명 *</label>
            <input type="text" name="name" value="${client.name}" required class="w-full border rounded px-3 py-2">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">설명</label>
            <textarea name="description" rows="2" class="w-full border rounded px-3 py-2">${client.description || ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">워드프레스 URL *</label>
            <input type="url" name="wordpress_url" value="${client.wordpress_url}" required class="w-full border rounded px-3 py-2">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">워드프레스 사용자명 *</label>
            <input type="text" name="wordpress_username" value="${client.wordpress_username}" required class="w-full border rounded px-3 py-2">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Application Password *</label>
            <input type="password" name="wordpress_password" value="${client.wordpress_password}" required class="w-full border rounded px-3 py-2">
            <p class="text-xs text-gray-500 mt-1">워드프레스에서 생성한 Application Password를 입력하세요</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">OpenAI API Key</label>
            <input type="password" name="openai_api_key" value="${client.openai_api_key || ''}" class="w-full border rounded px-3 py-2">
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1 flex items-center justify-between">
              <span>시스템 프롬프트 (AI 작성 지침)</span>
              <button type="button" onclick="showPromptHelp()" class="text-blue-500 text-xs hover:underline">
                <i class="fas fa-question-circle mr-1"></i>예시 보기
              </button>
            </label>
            <textarea name="system_prompt" rows="6" class="w-full border rounded px-3 py-2 font-mono text-sm" placeholder="AI가 콘텐츠를 생성할 때 따를 지침을 입력하세요...">${client.system_prompt || ''}</textarea>
            <p class="text-xs text-gray-500 mt-1">
              💡 SEO, AEO, C-RANK, GEO 최적화 등 원하는 전략을 입력하세요
            </p>
          </div>
          
          <div class="flex items-center">
            <input type="checkbox" name="is_active" id="edit_is_active" ${client.is_active ? 'checked' : ''} class="mr-2">
            <label for="edit_is_active" class="text-sm">활성 상태</label>
          </div>
          
          <div class="flex justify-end space-x-2 pt-4">
            <button type="button" onclick="hideEditClientModal()" class="px-4 py-2 border rounded hover:bg-gray-100">취소</button>
            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <i class="fas fa-save mr-2"></i>저장
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // 기존 모달 제거
  const existingModal = document.getElementById('edit-client-modal');
  if (existingModal) existingModal.remove();

  // 새 모달 추가
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // 폼 제출 핸들러
  document.getElementById('edit-client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    
    formData.forEach((value, key) => {
      if (key !== 'id') {
        if (key === 'is_active') {
          data[key] = formData.get('is_active') === 'on';
        } else {
          data[key] = value || undefined;
        }
      }
    });

    try {
      await axios.put(`${API_BASE}/clients/${client.id}`, data);
      showNotification('업체 정보가 수정되었습니다', 'success');
      hideEditClientModal();
      await loadClients();
      updateView();
    } catch (error) {
      showNotification(error.response?.data?.error || '수정에 실패했습니다', 'error');
    }
  });
}

function hideEditClientModal() {
  const modal = document.getElementById('edit-client-modal');
  if (modal) modal.remove();
}

function showPromptHelp() {
  const helpText = `
📝 시스템 프롬프트 예시

━━━━━━━━━━━━━━━━━━━━━━━
✅ 기본 템플릿:
━━━━━━━━━━━━━━━━━━━━━━━
You are a professional Korean content writer specializing in [분야]. 
Write engaging, SEO-optimized blog posts with proper HTML structure (H1, H2, H3 tags). 
Focus on providing valuable insights and actionable advice. 
Use a professional yet approachable tone.

━━━━━━━━━━━━━━━━━━━━━━━
✅ SEO 최적화 템플릿:
━━━━━━━━━━━━━━━━━━━━━━━
Create SEO-optimized Korean blog posts for [업종]. 
- Use H1 for main title, H2 for sections, H3 for subsections
- Include target keywords naturally (2-3% density)
- Write meta descriptions under 160 characters
- Add internal linking suggestions
- Create engaging introduction and strong CTA

━━━━━━━━━━━━━━━━━━━━━━━
✅ 지역 비즈니스 템플릿 (GEO):
━━━━━━━━━━━━━━━━━━━━━━━
Write local SEO content for [지역명] area [업종].
- Mention local landmarks and area names
- Use "near me" and location-based keywords
- Include business hours and contact information
- Add local customer testimonials style
- Focus on community engagement

━━━━━━━━━━━━━━━━━━━━━━━
✅ 전문성 강화 템플릿 (C-RANK):
━━━━━━━━━━━━━━━━━━━━━━━
Write authoritative content showing expertise in [분야].
- Cite reliable sources and statistics
- Use professional terminology appropriately
- Provide step-by-step guides
- Include expert tips and best practices
- Maintain consistent brand voice

━━━━━━━━━━━━━━━━━━━━━━━
✅ 검색 최적화 템플릿 (AEO):
━━━━━━━━━━━━━━━━━━━━━━━
Create content optimized for AI search engines and voice search.
- Structure content in Q&A format
- Provide direct, concise answers
- Use natural language and conversational tone
- Include "how to", "what is", "why" questions
- Add FAQ section at the end
  `;

  alert(helpText);
}

async function viewClientStats(id) {
  try {
    const response = await axios.get(`${API_BASE}/clients/${id}/stats`);
    const stats = response.data.data;
    const client = state.clients.find(c => c.id === id);
    
    if (!client) return;

    const modalHtml = `
      <div id="stats-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b flex justify-between items-center">
            <h3 class="text-xl font-bold">
              <i class="fas fa-chart-bar mr-2 text-blue-500"></i>
              ${client.name} - 통계
            </h3>
            <button onclick="hideStatsModal()" class="text-gray-500 hover:text-gray-700">
              <i class="fas fa-times text-2xl"></i>
            </button>
          </div>
          
          <div class="p-6">
            <!-- 전체 통계 카드 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-blue-600 text-sm font-medium">전체 콘텐츠</p>
                    <p class="text-3xl font-bold text-blue-900">${stats.total_contents}</p>
                  </div>
                  <i class="fas fa-file-alt text-4xl text-blue-400"></i>
                </div>
              </div>
              
              <div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-green-600 text-sm font-medium">발행 완료</p>
                    <p class="text-3xl font-bold text-green-900">${stats.published_contents}</p>
                  </div>
                  <i class="fas fa-check-circle text-4xl text-green-400"></i>
                </div>
              </div>
              
              <div class="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-yellow-600 text-sm font-medium">임시저장</p>
                    <p class="text-3xl font-bold text-yellow-900">${stats.draft_contents}</p>
                  </div>
                  <i class="fas fa-edit text-4xl text-yellow-400"></i>
                </div>
              </div>
            </div>

            <!-- 최근 활동 -->
            <div class="mb-6">
              <h4 class="text-lg font-semibold mb-3">
                <i class="fas fa-history mr-2"></i>최근 활동
              </h4>
              <div class="bg-gray-50 rounded-lg p-4">
                ${stats.recent_activities && stats.recent_activities.length > 0 ? 
                  stats.recent_activities.map(activity => `
                    <div class="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div class="flex items-center">
                        <i class="fas fa-${activity.action === 'content_generated' ? 'magic' : 'paper-plane'} mr-3 text-gray-500"></i>
                        <div>
                          <p class="font-medium">${activity.details}</p>
                          <p class="text-xs text-gray-500">${new Date(activity.created_at).toLocaleString('ko-KR')}</p>
                        </div>
                      </div>
                      <span class="px-2 py-1 rounded text-xs ${activity.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${activity.status === 'success' ? '성공' : '실패'}
                      </span>
                    </div>
                  `).join('')
                : '<p class="text-gray-500 text-center py-4">최근 활동이 없습니다</p>'}
              </div>
            </div>

            <!-- 콘텐츠 목록 -->
            <div>
              <h4 class="text-lg font-semibold mb-3">
                <i class="fas fa-list mr-2"></i>최근 콘텐츠
              </h4>
              <div class="space-y-2">
                ${stats.recent_contents && stats.recent_contents.length > 0 ?
                  stats.recent_contents.map(content => `
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100">
                      <div class="flex-1">
                        <p class="font-medium">${content.title}</p>
                        <p class="text-xs text-gray-500">${new Date(content.created_at).toLocaleString('ko-KR')}</p>
                      </div>
                      <span class="px-2 py-1 rounded text-xs ${getStatusColor(content.status)}">
                        ${getStatusText(content.status)}
                      </span>
                    </div>
                  `).join('')
                : '<p class="text-gray-500 text-center py-4">작성된 콘텐츠가 없습니다</p>'}
              </div>
            </div>
          </div>

          <div class="p-6 border-t bg-gray-50">
            <button onclick="hideStatsModal()" class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <i class="fas fa-times mr-2"></i>닫기
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  } catch (error) {
    console.error('통계 로드 실패:', error);
    showNotification('통계를 불러오는데 실패했습니다', 'error');
  }
}

function hideStatsModal() {
  const modal = document.getElementById('stats-modal');
  if (modal) modal.remove();
}

async function deleteClient(id) {
  if (!confirm('이 업체를 삭제하시겠습니까? 관련된 모든 데이터가 삭제됩니다.')) return;

  try {
    await axios.delete(`${API_BASE}/clients/${id}`);
    showNotification('업체가 삭제되었습니다', 'success');
    await loadClients();
    updateView();
  } catch (error) {
    showNotification('삭제에 실패했습니다', 'error');
  }
}

function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded shadow-lg z-50`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// 블로그 꾸미기 페이지 렌더링
function renderCustomize(container) {
  container.innerHTML = `
    <div class="bg-white rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold mb-6">
        <i class="fas fa-paint-brush mr-2 text-purple-500"></i>블로그 꾸미기
      </h2>

      <!-- 업체 선택 -->
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">꾸밀 블로그 선택</label>
        <select id="customize-client-select" class="w-full border rounded px-3 py-2" onchange="loadCustomizerSettings()">
          <option value="">업체를 선택하세요</option>
          ${state.clients.map(client => `
            <option value="${client.id}">${client.name} - ${client.wordpress_url}</option>
          `).join('')}
        </select>
      </div>

      <div id="customizer-content" class="hidden">
        <!-- 탭 메뉴 -->
        <div class="flex border-b mb-6">
          <button onclick="switchCustomizerTab('appearance')" class="px-6 py-3 border-b-2 border-purple-500 font-semibold text-purple-600" id="tab-appearance">
            <i class="fas fa-palette mr-2"></i>디자인
          </button>
          <button onclick="switchCustomizerTab('colors')" class="px-6 py-3 text-gray-600 hover:text-gray-900" id="tab-colors">
            <i class="fas fa-fill-drip mr-2"></i>색상
          </button>
          <button onclick="switchCustomizerTab('settings')" class="px-6 py-3 text-gray-600 hover:text-gray-900" id="tab-settings">
            <i class="fas fa-cog mr-2"></i>설정
          </button>
        </div>

        <!-- 디자인 탭 -->
        <div id="customizer-appearance" class="customizer-tab">
          <h3 class="text-lg font-semibold mb-4">
            <i class="fas fa-palette mr-2"></i>테마 및 레이아웃
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <!-- 테마 카드 예시 -->
            <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 cursor-pointer">
              <div class="bg-gray-100 h-32 rounded mb-3 flex items-center justify-center">
                <i class="fas fa-image text-4xl text-gray-400"></i>
              </div>
              <h4 class="font-semibold">클래식 테마</h4>
              <p class="text-xs text-gray-500">깔끔한 블로그 레이아웃</p>
              <button class="mt-2 w-full px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600" onclick="showNotification('테마 변경은 워드프레스 대시보드에서 직접 설정해주세요', 'info')">
                선택
              </button>
            </div>
            
            <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 cursor-pointer">
              <div class="bg-gray-100 h-32 rounded mb-3 flex items-center justify-center">
                <i class="fas fa-image text-4xl text-gray-400"></i>
              </div>
              <h4 class="font-semibold">모던 테마</h4>
              <p class="text-xs text-gray-500">세련된 디자인</p>
              <button class="mt-2 w-full px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600" onclick="showNotification('테마 변경은 워드프레스 대시보드에서 직접 설정해주세요', 'info')">
                선택
              </button>
            </div>
            
            <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-500 cursor-pointer">
              <div class="bg-gray-100 h-32 rounded mb-3 flex items-center justify-center">
                <i class="fas fa-image text-4xl text-gray-400"></i>
              </div>
              <h4 class="font-semibold">미니멀 테마</h4>
              <p class="text-xs text-gray-500">심플한 레이아웃</p>
              <button class="mt-2 w-full px-3 py-1 bg-purple-500 text-white text-sm rounded hover:bg-purple-600" onclick="showNotification('테마 변경은 워드프레스 대시보드에서 직접 설정해주세요', 'info')">
                선택
              </button>
            </div>
          </div>

          <div class="bg-blue-50 border-2 border-blue-200 rounded p-4">
            <p class="text-sm text-blue-900">
              <i class="fas fa-info-circle mr-2"></i>
              <strong>참고:</strong> 테마 변경은 워드프레스 대시보드에서 직접 설정할 수 있습니다.
            </p>
            <a id="wp-dashboard-link" href="#" target="_blank" class="inline-block mt-2 text-blue-600 hover:underline text-sm">
              <i class="fas fa-external-link-alt mr-1"></i>워드프레스 대시보드 열기
            </a>
          </div>
        </div>

        <!-- 색상 탭 -->
        <div id="customizer-colors" class="customizer-tab hidden">
          <h3 class="text-lg font-semibold mb-4">
            <i class="fas fa-fill-drip mr-2"></i>색상 설정
          </h3>
          
          <form id="color-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">주요 색상 (Primary)</label>
                <input type="color" name="primary_color" value="#2563eb" class="w-full h-12 border rounded">
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">보조 색상 (Secondary)</label>
                <input type="color" name="secondary_color" value="#7c3aed" class="w-full h-12 border rounded">
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">텍스트 색상</label>
                <input type="color" name="text_color" value="#1f2937" class="w-full h-12 border rounded">
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">배경 색상</label>
                <input type="color" name="background_color" value="#ffffff" class="w-full h-12 border rounded">
              </div>
            </div>

            <div class="bg-yellow-50 border-2 border-yellow-200 rounded p-4">
              <p class="text-sm text-yellow-900">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <strong>주의:</strong> 색상 적용은 테마에 따라 다르게 작동할 수 있습니다.
              </p>
            </div>

            <button type="submit" class="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              <i class="fas fa-save mr-2"></i>색상 저장
            </button>
          </form>
        </div>

        <!-- 설정 탭 -->
        <div id="customizer-settings" class="customizer-tab hidden">
          <h3 class="text-lg font-semibold mb-4">
            <i class="fas fa-cog mr-2"></i>사이트 설정
          </h3>
          
          <form id="settings-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">사이트 제목</label>
              <input type="text" name="title" placeholder="내 블로그" class="w-full border rounded px-3 py-2" id="site-title">
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-2">사이트 설명 (태그라인)</label>
              <input type="text" name="description" placeholder="짧은 소개글을 입력하세요" class="w-full border rounded px-3 py-2" id="site-description">
            </div>

            <div class="bg-green-50 border-2 border-green-200 rounded p-4">
              <p class="text-sm text-green-900">
                <i class="fas fa-lightbulb mr-2"></i>
                <strong>팁:</strong> 사이트 제목과 설명은 SEO에 중요한 역할을 합니다.
              </p>
            </div>

            <button type="submit" class="px-6 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              <i class="fas fa-save mr-2"></i>설정 저장
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // 색상 폼 제출 핸들러
  const colorForm = document.getElementById('color-form');
  if (colorForm) {
    colorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const clientId = document.getElementById('customize-client-select').value;
      
      if (!clientId) {
        showNotification('업체를 선택해주세요', 'error');
        return;
      }

      const data = Object.fromEntries(formData);
      
      try {
        await axios.post(`${API_BASE}/customizer/clients/${clientId}/colors`, data);
        showNotification('색상 설정이 저장되었습니다', 'success');
      } catch (error) {
        showNotification('색상 저장에 실패했습니다', 'error');
      }
    });
  }

  // 설정 폼 제출 핸들러
  const settingsForm = document.getElementById('settings-form');
  if (settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const clientId = document.getElementById('customize-client-select').value;
      
      if (!clientId) {
        showNotification('업체를 선택해주세요', 'error');
        return;
      }

      const data = Object.fromEntries(formData);
      
      try {
        await axios.put(`${API_BASE}/customizer/clients/${clientId}/settings`, data);
        showNotification('설정이 업데이트되었습니다', 'success');
      } catch (error) {
        showNotification('설정 업데이트에 실패했습니다', 'error');
      }
    });
  }
}

function loadCustomizerSettings() {
  const clientId = document.getElementById('customize-client-select').value;
  
  if (!clientId) {
    document.getElementById('customizer-content').classList.add('hidden');
    return;
  }

  document.getElementById('customizer-content').classList.remove('hidden');
  
  const client = state.clients.find(c => c.id == clientId);
  if (client) {
    document.getElementById('wp-dashboard-link').href = `${client.wordpress_url}/wp-admin`;
  }

  // 설정 로드
  axios.get(`${API_BASE}/customizer/clients/${clientId}/settings`)
    .then(response => {
      if (response.data.success) {
        const settings = response.data.data;
        document.getElementById('site-title').value = settings.name || '';
        document.getElementById('site-description').value = settings.description || '';
      }
    })
    .catch(error => {
      console.error('설정 로드 실패:', error);
    });
}

function switchCustomizerTab(tabName) {
  // 모든 탭 버튼 비활성화
  document.querySelectorAll('[id^="tab-"]').forEach(btn => {
    btn.className = 'px-6 py-3 text-gray-600 hover:text-gray-900';
  });
  
  // 모든 탭 내용 숨기기
  document.querySelectorAll('.customizer-tab').forEach(tab => {
    tab.classList.add('hidden');
  });
  
  // 선택된 탭 활성화
  document.getElementById(`tab-${tabName}`).className = 'px-6 py-3 border-b-2 border-purple-500 font-semibold text-purple-600';
  document.getElementById(`customizer-${tabName}`).classList.remove('hidden');
}
