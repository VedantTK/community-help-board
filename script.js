/* =========================================
   COMMUNITY HELP BOARD - FIREBASE VERSION
   Complete Functionality with Firestore
   ========================================= */

// ===== FIREBASE IMPORTS =====
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    doc, 
    query, 
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyCwlr-V5WVzr00h",
    authDomain: "community-help-board-9ef57.firebaseapp.com",
    projectId: "community-help-board-9ef57",
    storageBucket: "community-help-board-9ef57.firebasestorage.app",
    messagingSenderId: "759961271211",
    appId: "1:759961271211:web:",
    measurementId: "G-C4YYW5TQ0X"
};

// ===== INITIALIZE FIREBASE =====
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== GLOBAL STATE =====
let posts = [];
let currentFilter = 'all';
let deletePostId = null;
let unsubscribe = null; // For real-time listener

// ===== CATEGORIES =====
const CATEGORIES = ['Medical', 'Education', 'Jobs', 'Emergency', 'Events', 'Volunteers', 'Other'];

// ===== INITIALIZE APP =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupNavigation();
});

function initializeApp() {
    // Setup real-time listener for posts
    setupRealtimeListener();
    
    setupEventListeners();
    
    // Show loading state
    showLoading();
}

// ===== FIREBASE FIRESTORE FUNCTIONS =====

/**
 * Setup real-time listener for posts collection
 * This will automatically update the UI when posts change
 */
function setupRealtimeListener() {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    // Listen for real-time updates
    unsubscribe = onSnapshot(q, (snapshot) => {
        posts = [];
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                ...data,
                // Convert Firestore Timestamp to ISO string for compatibility
                date: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
            });
        });
        
        // Update UI
        renderPosts();
        updateCategoryCounts();
        updateHeroStats();
        toggleEmptyState();
        hideLoading();
    }, (error) => {
        console.error('Error listening to posts:', error);
        showToast('Error loading posts. Please refresh the page.', 'error');
        hideLoading();
    });
}

/**
 * Add a new post to Firestore
 */
async function createPostInFirestore(postData) {
    try {
        const postsRef = collection(db, 'posts');
        
        const docData = {
            title: postData.title,
            description: postData.description,
            category: postData.category,
            contactName: postData.contactName,
            contactInfo: postData.contactInfo,
            location: postData.location || '',
            createdAt: serverTimestamp(),
            resolved: false
        };
        
        await addDoc(postsRef, docData);
        
        showToast('Post created successfully!', 'success');
        closeModal();
    } catch (error) {
        console.error('Error creating post:', error);
        showToast('Error creating post. Please try again.', 'error');
    }
}

/**
 * Update a post in Firestore
 */
async function updatePostInFirestore(postId, postData) {
    try {
        const postRef = doc(db, 'posts', postId);
        
        await updateDoc(postRef, {
            title: postData.title,
            description: postData.description,
            category: postData.category,
            contactName: postData.contactName,
            contactInfo: postData.contactInfo,
            location: postData.location || '',
            updatedAt: serverTimestamp()
        });
        
        showToast('Post updated successfully!', 'success');
        closeModal();
    } catch (error) {
        console.error('Error updating post:', error);
        showToast('Error updating post. Please try again.', 'error');
    }
}

/**
 * Toggle resolved status in Firestore
 */
async function toggleResolvedInFirestore(postId, currentStatus) {
    try {
        const postRef = doc(db, 'posts', postId);
        
        await updateDoc(postRef, {
            resolved: !currentStatus,
            updatedAt: serverTimestamp()
        });
        
        const message = !currentStatus ? 'Post marked as resolved!' : 'Post marked as unresolved!';
        showToast(message, 'success');
    } catch (error) {
        console.error('Error updating post:', error);
        showToast('Error updating post. Please try again.', 'error');
    }
}

/**
 * Delete a post from Firestore
 */
async function deletePostFromFirestore(postId) {
    try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
        
        showToast('Post deleted successfully!', 'success');
        closeDeleteModal();
    } catch (error) {
        console.error('Error deleting post:', error);
        showToast('Error deleting post. Please try again.', 'error');
    }
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

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('createPostBtn').addEventListener('click', () => openModal());
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
        updatePostInFirestore(editId, postData);
    } else {
        createPostInFirestore(postData);
    }
}

function confirmDelete() {
    if (deletePostId) {
        deletePostFromFirestore(deletePostId);
    }
}

// Make toggleResolved available globally for onclick handlers
window.toggleResolved = function(postId) {
    const post = posts.find(p => p.id === postId);
    if (post) {
        toggleResolvedInFirestore(postId, post.resolved);
    }
};

// Make openModal and openDeleteModal available globally
window.openModal = openModal;
window.openDeleteModal = openDeleteModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;

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
            (post.location && post.location.toLowerCase().includes(searchTerm))
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

function showLoading() {
    const container = document.getElementById('postsContainer');
    container.innerHTML = '<div style="text-align: center; padding: 60px; color: #7f8c8d;"><i class="fas fa-spinner fa-spin" style="font-size: 3rem; margin-bottom: 20px;"></i><p style="font-size: 1.2rem;">Loading posts...</p></div>';
}

function hideLoading() {
    // Loading will be replaced by actual posts when renderPosts() is called
}

// ===== CLEANUP ON PAGE UNLOAD =====
window.addEventListener('beforeunload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});
