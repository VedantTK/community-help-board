/* =========================================
   COMMUNITY HELP BOARD - JAVASCRIPT
   Complete Functionality with Landing Page
   ========================================= */

// ===== GLOBAL STATE =====
let posts = [];
let currentFilter = 'all';
let deletePostId = null;

// ===== CATEGORIES =====
const CATEGORIES = ['Medical', 'Education', 'Jobs', 'Emergency', 'Events', 'Volunteers', 'Other'];

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupNavigation();
});

function initializeApp() {
    loadPosts();
    setupEventListeners();
    renderPosts();
    updateCategoryCounts();
    updateHeroStats();
    toggleEmptyState();
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== LOCALSTORAGE =====
function loadPosts() {
    const storedPosts = localStorage.getItem('communityHelpPosts');
    if (storedPosts) {
        posts = JSON.parse(storedPosts);
    } else {
        posts = [];
    }
}

function savePosts() {
    localStorage.setItem('communityHelpPosts', JSON.stringify(posts));
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('createPostBtn').addEventListener('click', openModal);
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });
    document.getElementById('postForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('postDescription').addEventListener('input', updateCharCount);
    
    // Close modals on outside click
    document.getElementById('postModal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    document.getElementById('deleteModal').addEventListener('click', function(e) {
        if (e.target === this) closeDeleteModal();
    });
    
    // ESC key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
            closeDeleteModal();
        }
    });
}

// ===== MODAL FUNCTIONS =====
function openModal(postId = null) {
    const modal = document.getElementById('postModal');
    const form = document.getElementById('postForm');
    const modalTitle = document.getElementById('modalTitle');
    
    form.reset();
    document.getElementById('charCount').textContent = '0';
    
    if (postId) {
        modalTitle.textContent = 'Edit Help Post';
        const post = posts.find(p => p.id === postId);
        if (post) {
            document.getElementById('postTitle').value = post.title;
            document.getElementById('postCategory').value = post.category;
            document.getElementById('postDescription').value = post.description;
            document.getElementById('contactName').value = post.contactName;
            document.getElementById('contactInfo').value = post.contactInfo;
            document.getElementById('location').value = post.location || '';
            updateCharCount();
        }
        form.dataset.editId = postId;
    } else {
        modalTitle.textContent = 'Create Help Post';
        delete form.dataset.editId;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        document.getElementById('postTitle').focus();
    }, 100);
}

function closeModal() {
    const modal = document.getElementById('postModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

function openDeleteModal(postId) {
    deletePostId = postId;
    const modal = document.getElementById('deleteModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    deletePostId = null;
}

// ===== FORM HANDLING =====
function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const editId = form.dataset.editId;
    
    const postData = {
        title: document.getElementById('postTitle').value.trim(),
        category: document.getElementById('postCategory').value,
        description: document.getElementById('postDescription').value.trim(),
        contactName: document.getElementById('contactName').value.trim(),
        contactInfo: document.getElementById('contactInfo').value.trim(),
        location: document.getElementById('location').value.trim(),
    };
    
    if (editId) {
        updatePost(editId, postData);
    } else {
        createPost(postData);
    }
}

function createPost(postData) {
    const newPost = {
        id: generateId(),
        ...postData,
        date: new Date().toISOString(),
        resolved: false
    };
    
    posts.unshift(newPost);
    savePosts();
    renderPosts();
    updateCategoryCounts();
    updateHeroStats();
    closeModal();
    
    showToast('Post created successfully!', 'success');
}

function updatePost(postId, postData) {
    const index = posts.findIndex(p => p.id === postId);
    if (index !== -1) {
        posts[index] = {
            ...posts[index],
            ...postData,
            updatedDate: new Date().toISOString()
        };
        savePosts();
        renderPosts();
        updateCategoryCounts();
        closeModal();
        
        showToast('Post updated successfully!', 'success');
    }
}

function confirmDelete() {
    if (deletePostId) {
        posts = posts.filter(p => p.id !== deletePostId);
        savePosts();
        renderPosts();
        updateCategoryCounts();
        updateHeroStats();
        closeDeleteModal();
        toggleEmptyState();
        
        showToast('Post deleted successfully!', 'success');
    }
}

function toggleResolved(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.resolved = !post.resolved;
        savePosts();
        renderPosts();
        updateHeroStats();
        
        const message = post.resolved ? 'Post marked as resolved!' : 'Post marked as unresolved!';
        showToast(message, 'success');
    }
}

// ===== RENDERING =====
function renderPosts() {
    const container = document.getElementById('postsContainer');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredPosts = posts;
    
    if (currentFilter !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === currentFilter);
    }
    
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) ||
            post.description.toLowerCase().includes(searchTerm) ||
            post.category.toLowerCase().includes(searchTerm) ||
            post.location.toLowerCase().includes(searchTerm)
        );
    }
    
    container.innerHTML = '';
    
    filteredPosts.forEach(post => {
        const postCard = createPostCard(post);
        container.appendChild(postCard);
    });
    
    toggleEmptyState();
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = `post-card ${post.category === 'Emergency' ? 'emergency' : ''} ${post.resolved ? 'resolved' : ''}`;
    
    const postDate = formatDate(post.date);
    const categoryIcon = getCategoryIcon(post.category);
    
    card.innerHTML = `
        <div class="post-header">
            <div class="category-tag">
                <i class="${categoryIcon}"></i>
                ${post.category}
            </div>
            <div class="post-date">
                <i class="fas fa-clock"></i> ${postDate}
            </div>
        </div>
        
        ${post.resolved ? '<div class="resolved-badge"><i class="fas fa-check-circle"></i> Resolved</div>' : ''}
        
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        
        <p class="post-description">${escapeHtml(post.description)}</p>
        
        ${post.location ? `
            <div class="post-location">
                <i class="fas fa-map-marker-alt"></i>
                ${escapeHtml(post.location)}
            </div>
        ` : ''}
        
        <div class="contact-info">
            <div class="contact-item">
                <i class="fas fa-user"></i>
                <strong>${escapeHtml(post.contactName)}</strong>
            </div>
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                ${escapeHtml(post.contactInfo)}
            </div>
        </div>
        
        <div class="post-actions">
            <button class="action-btn ${post.resolved ? 'resolved' : ''}" onclick="toggleResolved('${post.id}')">
                <i class="fas fa-${post.resolved ? 'undo' : 'check'}"></i>
                ${post.resolved ? 'Unresolve' : 'Resolve'}
            </button>
            <button class="action-btn delete" onclick="openDeleteModal('${post.id}')">
                <i class="fas fa-trash"></i>
                Delete
            </button>
        </div>
    `;
    
    return card;
}

// ===== FILTER & SEARCH =====
function handleFilter(e) {
    const filterBtn = e.currentTarget;
    const category = filterBtn.dataset.category;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterBtn.classList.add('active');
    
    currentFilter = category;
    renderPosts();
}

function handleSearch() {
    renderPosts();
}

function updateCategoryCounts() {
    document.getElementById('count-all').textContent = posts.length;
    
    CATEGORIES.forEach(category => {
        const count = posts.filter(p => p.category === category).length;
        const countElement = document.getElementById(`count-${category}`);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

function updateHeroStats() {
    const totalPosts = posts.filter(p => !p.resolved).length;
    const resolvedPosts = posts.filter(p => p.resolved).length;
    
    const totalElement = document.getElementById('totalPosts');
    const resolvedElement = document.getElementById('resolvedPosts');
    
    if (totalElement) {
        animateCounter(totalElement, totalPosts);
    }
    
    if (resolvedElement) {
        animateCounter(resolvedElement, resolvedPosts);
    }
}

// Store active timers to prevent multiple animations
const activeTimers = new Map();

function animateCounter(element, target) {
    // Clear any existing timer for this element
    if (activeTimers.has(element)) {
        clearInterval(activeTimers.get(element));
        activeTimers.delete(element);
    }
    
    const current = parseInt(element.textContent) || 0;
    
    // If already at target, just set it
    if (current === target) {
        element.textContent = target;
        return;
    }
    
    const increment = target > current ? 1 : -1;
    const duration = 1000;
    const steps = Math.abs(target - current);
    const stepDuration = steps > 0 ? Math.max(duration / steps, 20) : 0;
    
    let count = current;
    const timer = setInterval(() => {
        count += increment;
        
        // Safety check to prevent overshooting
        if ((increment > 0 && count >= target) || (increment < 0 && count <= target)) {
            count = target;
            element.textContent = count;
            clearInterval(timer);
            activeTimers.delete(element);
        } else {
            element.textContent = count;
        }
    }, stepDuration);
    
    // Store the timer
    activeTimers.set(element, timer);
}

// ===== UTILITY FUNCTIONS =====
function generateId() {
    return 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getCategoryIcon(category) {
    const icons = {
        'Medical': 'fas fa-heartbeat',
        'Education': 'fas fa-graduation-cap',
        'Jobs': 'fas fa-briefcase',
        'Emergency': 'fas fa-exclamation-triangle',
        'Events': 'fas fa-calendar-alt',
        'Volunteers': 'fas fa-users',
        'Other': 'fas fa-ellipsis-h'
    };
    return icons[category] || 'fas fa-info-circle';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCharCount() {
    const textarea = document.getElementById('postDescription');
    const charCount = document.getElementById('charCount');
    charCount.textContent = textarea.value.length;
}

function toggleEmptyState() {
    const postsContainer = document.getElementById('postsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (posts.length === 0) {
        postsContainer.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        postsContainer.style.display = 'grid';
        emptyState.style.display = 'none';
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    toast.prepend(icon);
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== SAMPLE DATA (OPTIONAL) =====
function addSamplePosts() {
    if (posts.length === 0) {
        const samplePosts = [
            {
                id: generateId(),
                title: 'Need Blood Donation - AB+ Urgent',
                category: 'Emergency',
                description: 'My brother urgently needs AB+ blood for surgery tomorrow morning. Please contact if you can help.',
                contactName: 'Rajesh Kumar',
                contactInfo: '+91 98765 43210',
                location: 'City Hospital, Mumbai',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                resolved: false
            },
            {
                id: generateId(),
                title: 'Free Tuition Classes for Village Children',
                category: 'Education',
                description: 'Starting free weekend classes for students from grades 1-10. Need volunteers who can teach Math and Science.',
                contactName: 'Priya Sharma',
                contactInfo: 'priya.education@gmail.com',
                location: 'Green Valley School',
                date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                resolved: false
            },
            {
                id: generateId(),
                title: 'Hiring Part-Time Data Entry Operators',
                category: 'Jobs',
                description: 'Our NGO is looking for 5 part-time data entry operators. No experience required, training will be provided.',
                contactName: 'Community Skills Center',
                contactInfo: '+91 87654 32109',
                location: 'Pune',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                resolved: false
            },
            {
                id: generateId(),
                title: 'Community Health Camp - Free Checkup',
                category: 'Events',
                description: 'Free health checkup camp on Sunday. Includes blood pressure, sugar testing, and doctor consultation.',
                contactName: 'Dr. Amit Patel',
                contactInfo: '+91 99887 76655',
                location: 'Community Hall, Nashik',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                resolved: false
            },
            {
                id: generateId(),
                title: 'Volunteers Needed for Tree Plantation Drive',
                category: 'Volunteers',
                description: 'Join us next Saturday for a tree plantation drive. We aim to plant 1000 trees. Refreshments will be provided.',
                contactName: 'Green Earth NGO',
                contactInfo: 'contact@greenearth.org',
                location: 'Riverfront Park',
                date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
                resolved: false
            }
        ];
        
        posts = samplePosts;
        savePosts();
        renderPosts();
        updateCategoryCounts();
        updateHeroStats();
    }
}

// Uncomment to enable sample data on first load
// addSamplePosts();
