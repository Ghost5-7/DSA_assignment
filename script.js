function validateHTML() {
    const htmlInput = document.getElementById('htmlInput').value;
    const result = document.getElementById('result');
    
    // First check parentheses
    if (!validateParentheses(htmlInput)) {
        displayResult(false, 'Error: Mismatched parentheses');
        return;
    }

    // Then check HTML tags
    validateTags(htmlInput);
}

function validateParentheses(input) {
    const stack = [];
    const openBrackets = "({[<";
    const closeBrackets = ")}]>";
    
    for (let char of input) {
        if (openBrackets.includes(char)) {
            stack.push(char);
        } else if (closeBrackets.includes(char)) {
            const lastOpen = stack.pop();
            const expectedOpen = openBrackets[closeBrackets.indexOf(char)];
            
            if (lastOpen !== expectedOpen) {
                return false;
            }
        }
    }
    
    return stack.length === 0;
}

function validateTags(input) {
    const stack = [];
    // Basic tag regex to catch all potential tags
    const tagRegex = /<[^>]+>/g;
    
    const validHtmlTags = [
        'html', 'head', 'title', 'body', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'form', 'input',
        'button', 'select', 'option', 'label', 'textarea', 'script', 'style', 'link', 'meta',
        'header', 'footer', 'nav', 'main', 'section', 'article'
    ];

    const selfClosingTags = [
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    
    // First, check for invalid bracket patterns
    if (input.includes('<<') || input.includes('>>')) {
        displayResult(false, 'Error: Invalid syntax - multiple angle brackets found');
        return;
    }

    const tags = input.match(tagRegex) || [];
    
    for (let tag of tags) {
        // Check for nested angle brackets
        if (/<[^>]*<|>[^<]*>/g.test(tag)) {
            displayResult(false, `Error: Invalid tag syntax '${tag}'`);
            return;
        }

        // Extract tag name
        const tagMatch = tag.match(/<\/?([a-z][a-z0-9]*)/i);
        if (!tagMatch) {
            displayResult(false, `Error: Invalid tag format '${tag}'`);
            return;
        }

        let tagName = tagMatch[1].toLowerCase();
        
        // Check if it's a valid HTML tag
        if (!validHtmlTags.includes(tagName) && !selfClosingTags.includes(tagName)) {
            displayResult(false, `Error: Invalid HTML tag '${tagName}'`);
            return;
        }

        if (tag.startsWith('</')) {
            if (stack.length === 0) {
                displayResult(false, `Error: Found closing tag '${tag}' without matching opening tag`);
                return;
            }
            
            const lastOpenTag = stack.pop();
            if (tagName !== lastOpenTag) {
                displayResult(false, `Error: Mismatched tags. Expected '</${lastOpenTag}>', found '${tag}'`);
                return;
            }
        } else {
            // It's an opening tag
            if (selfClosingTags.includes(tagName)) {
                if (!tag.endsWith('/>') && !tag.endsWith('>')) {
                    displayResult(false, `Error: Self-closing tag '${tagName}' must end with '/>' or '>'`);
                    return;
                }
                continue;
            }
            
            if (tag.endsWith('/>')) {
                continue;
            }
            
            stack.push(tagName);
        }
    }
    
    if (stack.length > 0) {
        displayResult(false, `Error: Unclosed tags: ${stack.join(', ')}`);
        return;
    }
    
    displayResult(true, 'All HTML tags and parentheses are properly matched!');
}

function displayResult(isValid, message) {
    const result = document.getElementById('result');
    result.className = 'result ' + (isValid ? 'valid' : 'invalid');
    result.textContent = message;
}
