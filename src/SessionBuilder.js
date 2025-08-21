export default class SessionBuilder {
  constructor(config) {
    this.practices = config.practices || [];
    this.posture = config.posture || 'Sitting';
    this.practicesContainer = config.practicesContainer;
    this.postureContainer = config.postureContainer;
    this.practiceSelector = config.practiceSelector;
    this.onUpdate = config.onUpdate || (() => {});
    this.namespace = config.namespace || 'session';
    // Injected dependencies
    this.postures = config.postures || ['Sitting', 'Standing', 'Walking', 'Lying down'];
    this.practiceConfig = config.practiceConfig || {};
    this.createCategoryElement = config.createCategoryElement;

    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDragEnd = this.handleDragEnd.bind(this);
    this.handleDragOver = this.handleDragOver.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);

    this.pointerDragging = false;
    this.pointerStartY = 0;
    this.draggedClone = null;
    this.activeListeners = new WeakMap();

    this.initializePostureButtons();
    this.updatePracticesList();
  }

  initializePostureButtons() {
    if (!this.postureContainer) return;
    const fragment = document.createDocumentFragment();
    this.postures.forEach(posture => {
      const btn = document.createElement('button');
      btn.className = 'posture-btn';
      btn.textContent = posture;
      btn.onclick = () => this.selectPosture(posture);
      btn.classList.toggle('selected', posture === this.posture);
      fragment.appendChild(btn);
    });
    while (this.postureContainer.firstChild) {
      this.postureContainer.removeChild(this.postureContainer.firstChild);
    }
    this.postureContainer.appendChild(fragment);
  }

  selectPosture(posture) {
    this.posture = posture;
    this.postureContainer.querySelectorAll('.posture-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.textContent === posture);
    });
    this.onUpdate();
  }

  updatePracticesList() {
    if (!this.practicesContainer) return;
    this.cleanupEventListeners();
    if (this.practices.length === 0) {
      const message = document.createElement('p');
      message.className = 'empty-message';
      message.textContent = 'No practices selected';
      this.practicesContainer.appendChild(message);
      return;
    }
    const fragment = document.createDocumentFragment();
    this.practices.forEach((practice, index) => {
      const item = document.createElement('div');
      item.className = 'selected-practice-item';
      item.dataset.index = index;
      item.dataset.namespace = this.namespace;
      const content = document.createElement('div');
      content.style.display = 'flex';
      content.style.alignItems = 'center';
      const handle = document.createElement('span');
      handle.className = 'drag-handle';
      handle.textContent = '≡';
      const pointerHandler = (e) => this.handlePointerDown(e, item);
      const touchHandler = (e) => e.preventDefault();
      this.addEventListenerWithTracking(handle, 'pointerdown', pointerHandler);
      this.addEventListenerWithTracking(handle, 'touchstart', touchHandler, { passive: false });
      const order = document.createElement('span');
      order.className = 'practice-order';
      order.textContent = `${index + 1}.`;
      const text = document.createElement('span');
      text.textContent = practice;
      content.appendChild(handle);
      content.appendChild(order);
      content.appendChild(text);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-practice';
      removeBtn.textContent = '×';
      removeBtn.onclick = () => this.removePractice(index);
      item.appendChild(content);
      item.appendChild(removeBtn);
      item.draggable = true;
      this.addEventListenerWithTracking(item, 'dragstart', this.handleDragStart);
      this.addEventListenerWithTracking(item, 'dragend', this.handleDragEnd);
      this.addEventListenerWithTracking(item, 'dragover', this.handleDragOver);
      this.addEventListenerWithTracking(item, 'drop', this.handleDrop);
      this.addEventListenerWithTracking(item, 'dragenter', this.handleDragEnter);
      this.addEventListenerWithTracking(item, 'dragleave', this.handleDragLeave);
      fragment.appendChild(item);
    });
    while (this.practicesContainer.firstChild) {
      this.practicesContainer.removeChild(this.practicesContainer.firstChild);
    }
    this.practicesContainer.appendChild(fragment);
  }

  addEventListenerWithTracking(element, type, handler, options) {
    element.addEventListener(type, handler, options);
    if (!this.activeListeners.has(element)) {
      this.activeListeners.set(element, []);
    }
    this.activeListeners.get(element).push({ type, handler, options });
  }

  cleanupEventListeners() {
    if (!this.practicesContainer) return;
    const items = this.practicesContainer.querySelectorAll('.selected-practice-item');
    items.forEach(item => {
      const listeners = this.activeListeners.get(item);
      if (listeners) {
        listeners.forEach(({ type, handler, options }) => {
          item.removeEventListener(type, handler, options);
        });
        this.activeListeners.delete(item);
      }
      const handle = item.querySelector('.drag-handle');
      if (handle) {
        const handleListeners = this.activeListeners.get(handle);
        if (handleListeners) {
          handleListeners.forEach(({ type, handler, options }) => {
            handle.removeEventListener(type, handler, options);
          });
          this.activeListeners.delete(handle);
        }
      }
    });
  }

  addPractice(practice) {
    this.practices.push(practice);
    this.updatePracticesList();
    this.onUpdate();
  }

  removePractice(index) {
    this.practices.splice(index, 1);
    this.updatePracticesList();
    this.onUpdate();
  }

  showPracticeSelector() {
    if (!this.practiceSelector) return;
    this.practiceSelector.style.display = 'block';
    const categoriesDiv = document.createElement('div');
    categoriesDiv.className = 'practice-categories';
    Object.entries(this.practiceConfig).forEach(([key, category]) => {
      const categoryClone = this.createCategoryElement
        ? this.createCategoryElement(key, category, (practice) => {
            this.addPractice(practice);
            this.practiceSelector.style.display = 'none';
          })
        : null;
      if (categoryClone) categoriesDiv.appendChild(categoryClone);
    });
    while (this.practiceSelector.firstChild) {
      this.practiceSelector.removeChild(this.practiceSelector.firstChild);
    }
    this.practiceSelector.appendChild(categoriesDiv);
  }

  handleDragStart(e) {
    const item = e.currentTarget;
    this.draggedElement = item;
    this.draggedIndex = parseInt(item.dataset.index);
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.draggedIndex);
  }
  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    this.practicesContainer.querySelectorAll('.selected-practice-item').forEach(item => {
      item.classList.remove('drag-over');
    });
  }
  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const afterElement = this.getDragAfterElement(e.clientY);
    const draggingItem = this.practicesContainer.querySelector('.dragging');
    if (afterElement == null) this.practicesContainer.appendChild(draggingItem);
    else this.practicesContainer.insertBefore(draggingItem, afterElement);
  }
  handleDragEnter(e) {
    if (e.preventDefault) e.preventDefault();
    if (e.currentTarget !== this.draggedElement) e.currentTarget.classList.add('drag-over');
    return false;
  }
  handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const items = [...this.practicesContainer.querySelectorAll('.selected-practice-item')];
    const newOrder = items.map(item => {
      const index = parseInt(item.dataset.index);
      return this.practices[index];
    });
    this.practices = newOrder;
    this.updatePracticesList();
    this.onUpdate();
  }
  getDragAfterElement(y) {
    const draggableElements = [...this.practicesContainer.querySelectorAll('.selected-practice-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }
  getPractices() { return [...this.practices]; }
  getPosture() { return this.posture; }
  loadSession(practices, posture) {
    this.practices = [...practices];
    this.posture = posture || 'Sitting';
    this.initializePostureButtons();
    this.updatePracticesList();
  }
  destroy() {
    this.cleanupEventListeners();
    this.practices = [];
    this.onUpdate = null;
    this.practicesContainer = null;
    this.postureContainer = null;
    this.practiceSelector = null;
    this.activeListeners = null;
  }
  handlePointerDown(e, item) {
    if (e.button !== 0) return;
    this.pointerDragging = true;
    this.draggedElement = item;
    this.draggedIndex = parseInt(item.dataset.index);
    this.pointerStartY = e.clientY;
    item.classList.add('dragging');
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);
    document.addEventListener('pointercancel', this.handlePointerUp);
    e.preventDefault();
  }
  handlePointerMove(e) {
    if (!this.pointerDragging) return;
    const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
    if (!elementBelow) return;
    const hoverItem = elementBelow.closest('.selected-practice-item');
    if (!hoverItem || hoverItem === this.draggedElement) return;
    const afterElement = this.getDragAfterElement(e.clientY);
    if (afterElement == null) {
      this.practicesContainer.appendChild(this.draggedElement);
    } else {
      this.practicesContainer.insertBefore(this.draggedElement, afterElement);
    }
  }
  handlePointerUp() {
    if (!this.pointerDragging) return;
    this.pointerDragging = false;
    if (this.draggedElement) this.draggedElement.classList.remove('dragging');
    const items = [...this.practicesContainer.querySelectorAll('.selected-practice-item')];
    const newOrder = items.map(item => this.practices[parseInt(item.dataset.index)]);
    this.practices = newOrder;
    this.updatePracticesList();
    this.onUpdate();
    document.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('pointerup', this.handlePointerUp);
    document.removeEventListener('pointercancel', this.handlePointerUp);
  }
}

