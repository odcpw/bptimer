// UI helper factory for practice category rendering
// Injects dependencies to avoid tight coupling with app state
export function createCategoryElementFactory(getPracticeInfo, showPracticeInfo) {
  function createCategoryElement(key, category, onPracticeClick) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'category-group';

    const header = document.createElement('div');
    header.className = 'category-header';

    const name = document.createElement('span');
    name.textContent = category.name;

    const arrow = document.createElement('span');
    arrow.className = 'category-arrow';
    arrow.textContent = '▶';

    header.appendChild(name);
    header.appendChild(arrow);

    const practicesDiv = document.createElement('div');
    practicesDiv.className = 'category-practices';

    Object.entries(category.practices).forEach(([practiceName, subPractices]) => {
      const isSimplePractice = subPractices === null || (subPractices && subPractices.info);

      if (isSimplePractice) {
        const practiceWrapper = document.createElement('div');
        practiceWrapper.className = 'practice-item-wrapper';

        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'practice-item';
        practiceBtn.textContent = practiceName;
        practiceBtn.onclick = () => onPracticeClick(practiceName);

        practiceWrapper.appendChild(practiceBtn);

        if (getPracticeInfo(practiceName)) {
          const infoBtn = document.createElement('button');
          infoBtn.className = 'practice-info-btn';
          infoBtn.textContent = 'ℹ️';
          infoBtn.title = 'View practice information';
          infoBtn.onclick = (e) => {
            e.stopPropagation();
            showPracticeInfo(practiceName);
          };
          practiceWrapper.appendChild(infoBtn);
        }

        practicesDiv.appendChild(practiceWrapper);
      } else if (typeof subPractices === 'object') {
        const subcategoryDiv = createSubcategoryElement(practiceName, subPractices, onPracticeClick);
        practicesDiv.appendChild(subcategoryDiv);
      }
    });

    header.onclick = () => {
      const isExpanded = header.classList.contains('expanded');
      header.classList.toggle('expanded', !isExpanded);
      practicesDiv.classList.toggle('expanded', !isExpanded);
    };

    categoryDiv.appendChild(header);
    categoryDiv.appendChild(practicesDiv);

    return categoryDiv;
  }

  function createSubcategoryElement(name, subPractices, onPracticeClick) {
    const subcategoryDiv = document.createElement('div');
    subcategoryDiv.className = 'subcategory-group';

    const header = document.createElement('div');
    header.className = 'subcategory-header';

    const text = document.createElement('span');
    text.textContent = name;

    const arrow = document.createElement('span');
    arrow.className = 'category-arrow';
    arrow.textContent = '▶';

    header.appendChild(text);
    header.appendChild(arrow);

    const practicesDiv = document.createElement('div');
    practicesDiv.className = 'subcategory-practices';

    if (Array.isArray(subPractices)) {
      subPractices.forEach(practice => {
        const practiceWrapper = document.createElement('div');
        practiceWrapper.className = 'practice-item-wrapper';

        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'practice-item';
        practiceBtn.textContent = practice;
        practiceBtn.onclick = () => onPracticeClick(`${name} - ${practice}`);

        practiceWrapper.appendChild(practiceBtn);

        if (getPracticeInfo(practice)) {
          const infoBtn = document.createElement('button');
          infoBtn.className = 'practice-info-btn';
          infoBtn.textContent = 'ℹ️';
          infoBtn.title = 'View practice information';
          infoBtn.onclick = (e) => {
            e.stopPropagation();
            showPracticeInfo(practice);
          };
          practiceWrapper.appendChild(infoBtn);
        }

        practicesDiv.appendChild(practiceWrapper);
      });
    } else {
      Object.entries(subPractices).forEach(([subName, items]) => {
        const isSimplePractice = items === null || (items && items.info);

        if (isSimplePractice) {
          const practiceWrapper = document.createElement('div');
          practiceWrapper.className = 'practice-item-wrapper';

          const practiceBtn = document.createElement('button');
          practiceBtn.className = 'practice-item';
          practiceBtn.textContent = subName;
          practiceBtn.onclick = () => onPracticeClick(`${name} - ${subName}`);

          practiceWrapper.appendChild(practiceBtn);

          if (getPracticeInfo(subName)) {
            const infoBtn = document.createElement('button');
            infoBtn.className = 'practice-info-btn';
            infoBtn.textContent = 'ℹ️';
            infoBtn.title = 'View practice information';
            infoBtn.onclick = (e) => {
              e.stopPropagation();
              showPracticeInfo(subName);
            };
            practiceWrapper.appendChild(infoBtn);
          }

          practicesDiv.appendChild(practiceWrapper);
        } else if (Array.isArray(items)) {
          items.forEach(item => {
            const practiceBtn = document.createElement('button');
            practiceBtn.className = 'practice-item';
            practiceBtn.textContent = `${subName}: ${item}`;
            practiceBtn.onclick = () => onPracticeClick(`${name} - ${subName}: ${item}`);
            practicesDiv.appendChild(practiceBtn);
          });
        }
      });
    }

    header.onclick = () => {
      const isExpanded = header.classList.contains('expanded');
      header.classList.toggle('expanded', !isExpanded);
      practicesDiv.classList.toggle('expanded', !isExpanded);
    };

    subcategoryDiv.appendChild(header);
    subcategoryDiv.appendChild(practicesDiv);

    return subcategoryDiv;
  }

  return createCategoryElement;
}

