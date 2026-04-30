/**
 * Task Object Structure:
 * {
 *    id: string/number (unique identifier)
 *    name: string
 *    deadline: Date/string (ISO format)
 *    priority: number
 *    createdAt: timestamp
 * }
 */

class MinHeap {
    constructor() {
        this.heap = [];
    }

    // Helper methods for tree navigation
    getLeftChildIndex(parentIndex) { return 2 * parentIndex + 1; }
    getRightChildIndex(parentIndex) { return 2 * parentIndex + 2; }
    getParentIndex(childIndex) { return Math.floor((childIndex - 1) / 2); }

    hasLeftChild(index) { return this.getLeftChildIndex(index) < this.heap.length; }
    hasRightChild(index) { return this.getRightChildIndex(index) < this.heap.length; }
    hasParent(index) { return this.getParentIndex(index) >= 0; }

    leftChild(index) { return this.heap[this.getLeftChildIndex(index)]; }
    rightChild(index) { return this.heap[this.getRightChildIndex(index)]; }
    parent(index) { return this.heap[this.getParentIndex(index)]; }

    swap(indexOne, indexTwo) {
        const temp = this.heap[indexOne];
        this.heap[indexOne] = this.heap[indexTwo];
        this.heap[indexTwo] = temp;
    }

    /**
     * Compare two tasks.
     * Returns < 0 if task1 is MORE important than task2
     * Returns > 0 if task1 is LESS important than task2
     * Returns 0 if equal
     */
    compare(task1, task2) {
        // Primary sort: earlier deadline comes first
        const time1 = new Date(task1.deadline).getTime();
        const time2 = new Date(task2.deadline).getTime();
        
        if (time1 !== time2) {
            return time1 - time2;
        }

        // Secondary sort: if deadlines are equal, lower priority value comes first
        if (task1.priority !== task2.priority) {
            return task1.priority - task2.priority;
        }

        // If both are equal, preserve insertion order using createdAt
        return task1.createdAt - task2.createdAt;
    }

    // Peek at the most important task without removing it
    peek() {
        if (this.heap.length === 0) return null;
        return this.heap[0];
    }

    // Insert a new task into the heap
    insert(task) {
        this.heap.push(task);
        this.heapifyUp();
    }

    // Extract (remove and return) the most important task
    extractMin() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();

        const item = this.heap[0];
        // Move the last element to the root
        this.heap[0] = this.heap.pop();
        this.heapifyDown();
        return item;
    }

    // Remove a task by its ID
    removeById(id) {
        // Find the index of the task
        const index = this.heap.findIndex(task => task.id === id);
        if (index === -1) return false;

        // If it's the last element, just pop it
        if (index === this.heap.length - 1) {
            this.heap.pop();
            return true;
        }

        // Otherwise, replace it with the last element
        this.heap[index] = this.heap.pop();
        
        // Fix the heap property
        // We might need to bubble up OR bubble down depending on the new value
        const parentIdx = this.getParentIndex(index);
        
        if (this.hasParent(index) && this.compare(this.heap[index], this.heap[parentIdx]) < 0) {
            this.heapifyUp(index);
        } else {
            this.heapifyDown(index);
        }

        return true;
    }

    // Heapify Up (Bubble Up)
    heapifyUp(index = this.heap.length - 1) {
        let currentIndex = index;
        
        // While there is a parent and the current node is MORE important than its parent
        while (
            this.hasParent(currentIndex) && 
            this.compare(this.heap[currentIndex], this.parent(currentIndex)) < 0
        ) {
            this.swap(this.getParentIndex(currentIndex), currentIndex);
            currentIndex = this.getParentIndex(currentIndex);
        }
    }

    // Heapify Down (Bubble Down)
    heapifyDown(index = 0) {
        let currentIndex = index;
        
        while (this.hasLeftChild(currentIndex)) {
            let smallerChildIndex = this.getLeftChildIndex(currentIndex);
            
            // If there's a right child and it's MORE important than the left child
            if (
                this.hasRightChild(currentIndex) && 
                this.compare(this.rightChild(currentIndex), this.leftChild(currentIndex)) < 0
            ) {
                smallerChildIndex = this.getRightChildIndex(currentIndex);
            }

            // If the current node is MORE important than (or equal to) the smallest child, we're done
            if (this.compare(this.heap[currentIndex], this.heap[smallerChildIndex]) <= 0) {
                break;
            }

            // Otherwise, swap and continue down
            this.swap(currentIndex, smallerChildIndex);
            currentIndex = smallerChildIndex;
        }
    }

    // Load from an array (useful for initializing from localStorage)
    buildHeap(array) {
        this.heap = array;
        // Start from the last non-leaf node and heapify down
        for (let i = Math.floor(this.heap.length / 2) - 1; i >= 0; i--) {
            this.heapifyDown(i);
        }
    }

    // Get the underlying array (for visualization)
    getArray() {
        return [...this.heap];
    }
}
