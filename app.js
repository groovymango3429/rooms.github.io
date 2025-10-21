// List of all friends
const friends = ['Austin', 'Luke', 'Ian', 'Jackson', 'Jack', 'Jacob', 'Patrick', 'Elijah'];

// Initialize localStorage if not exists
if (!localStorage.getItem('roomAssignments')) {
    localStorage.setItem('roomAssignments', JSON.stringify({}));
}

// Update the ranking inputs based on selected friend
document.getElementById('friend-select').addEventListener('change', function() {
    const selectedFriend = this.value;
    const rankingInputsDiv = document.getElementById('ranking-inputs');
    rankingInputsDiv.innerHTML = '';
    
    if (!selectedFriend) {
        return;
    }
    
    // Check if this friend has already submitted
    const submissions = JSON.parse(localStorage.getItem('roomAssignments'));
    if (submissions[selectedFriend]) {
        rankingInputsDiv.innerHTML = '<p class="already-submitted">✅ You have already submitted your rankings!</p>';
        document.querySelector('.submit-btn').disabled = true;
        return;
    }
    
    document.querySelector('.submit-btn').disabled = false;
    
    // Get list of other friends (excluding the selected one)
    const otherFriends = friends.filter(f => f !== selectedFriend);
    
    otherFriends.forEach((friend, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';
        div.innerHTML = `
            <label for="rank-${friend}">${friend}:</label>
            <select id="rank-${friend}" name="${friend}" required>
                <option value="">-- Select Rank --</option>
                <option value="1">1 (Most Preferred)</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7 (Least Preferred)</option>
            </select>
        `;
        rankingInputsDiv.appendChild(div);
    });
});

// Handle form submission
document.getElementById('ranking-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const selectedFriend = document.getElementById('friend-select').value;
    if (!selectedFriend) {
        alert('Please select your name!');
        return;
    }
    
    const otherFriends = friends.filter(f => f !== selectedFriend);
    const rankings = {};
    const usedRanks = new Set();
    
    // Collect rankings and validate
    for (const friend of otherFriends) {
        const rank = document.getElementById(`rank-${friend}`).value;
        if (!rank) {
            alert('Please rank all friends!');
            return;
        }
        
        if (usedRanks.has(rank)) {
            alert('Each rank must be unique! You cannot use the same rank twice.');
            return;
        }
        
        usedRanks.add(rank);
        rankings[friend] = parseInt(rank);
    }
    
    // Save to localStorage
    const submissions = JSON.parse(localStorage.getItem('roomAssignments'));
    submissions[selectedFriend] = rankings;
    localStorage.setItem('roomAssignments', JSON.stringify(submissions));
    
    alert('Rankings submitted successfully! ✅');
    
    // Reset form
    document.getElementById('ranking-form').reset();
    document.getElementById('ranking-inputs').innerHTML = '';
    
    // Update status
    updateSubmissionStatus();
    
    // Check if all submitted
    if (Object.keys(submissions).length === 8) {
        calculateRoomAssignments();
    }
});

// Update submission status
function updateSubmissionStatus() {
    const submissions = JSON.parse(localStorage.getItem('roomAssignments'));
    const count = Object.keys(submissions).length;
    
    document.getElementById('submitted-count').textContent = count;
    
    const submittedNamesDiv = document.getElementById('submitted-names');
    if (count > 0) {
        const names = Object.keys(submissions).join(', ');
        submittedNamesDiv.innerHTML = `<p class="submitted-list">Submitted: ${names}</p>`;
    } else {
        submittedNamesDiv.innerHTML = '';
    }
}

// Calculate optimal room assignments
function calculateRoomAssignments() {
    const submissions = JSON.parse(localStorage.getItem('roomAssignments'));
    
    // Create a compatibility matrix
    const compatibilityMatrix = {};
    
    friends.forEach(person => {
        compatibilityMatrix[person] = {};
        friends.forEach(other => {
            if (person !== other) {
                // Lower score = better compatibility
                // Score is sum of how they ranked each other
                const personRankOfOther = submissions[person]?.[other] || 7;
                const otherRankOfPerson = submissions[other]?.[person] || 7;
                compatibilityMatrix[person][other] = personRankOfOther + otherRankOfPerson;
            }
        });
    });
    
    // Find best room split using brute force for 8 people (70 combinations)
    let bestScore = Infinity;
    let bestRoom1 = [];
    let bestRoom2 = [];
    
    // Generate all combinations of 4 people from 8
    const combinations = getCombinations(friends, 4);
    
    combinations.forEach(room1 => {
        const room2 = friends.filter(f => !room1.includes(f));
        
        // Calculate total compatibility score for this split
        const score = calculateRoomScore(room1, compatibilityMatrix) + 
                     calculateRoomScore(room2, compatibilityMatrix);
        
        if (score < bestScore) {
            bestScore = score;
            bestRoom1 = room1;
            bestRoom2 = room2;
        }
    });
    
    // Display results
    displayResults(bestRoom1, bestRoom2);
}

// Calculate compatibility score for a room
function calculateRoomScore(room, matrix) {
    let score = 0;
    for (let i = 0; i < room.length; i++) {
        for (let j = i + 1; j < room.length; j++) {
            score += matrix[room[i]][room[j]];
        }
    }
    return score;
}

// Generate combinations
function getCombinations(arr, k) {
    const result = [];
    
    function combine(start, combo) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        
        for (let i = start; i < arr.length; i++) {
            combo.push(arr[i]);
            combine(i + 1, combo);
            combo.pop();
        }
    }
    
    combine(0, []);
    return result;
}

// Display results
function displayResults(room1, room2) {
    document.getElementById('form-container').style.display = 'none';
    document.getElementById('results').style.display = 'block';
    
    const room1List = document.getElementById('room1-list');
    const room2List = document.getElementById('room2-list');
    
    room1List.innerHTML = '';
    room2List.innerHTML = '';
    
    room1.forEach(person => {
        const li = document.createElement('li');
        li.textContent = person;
        room1List.appendChild(li);
    });
    
    room2.forEach(person => {
        const li = document.createElement('li');
        li.textContent = person;
        room2List.appendChild(li);
    });
}

// Reset button
document.getElementById('reset-btn')?.addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all submissions?')) {
        localStorage.setItem('roomAssignments', JSON.stringify({}));
        location.reload();
    }
});

// Initialize on page load
updateSubmissionStatus();

// Check if all submissions are in on load
const submissions = JSON.parse(localStorage.getItem('roomAssignments'));
if (Object.keys(submissions).length === 8) {
    calculateRoomAssignments();
}