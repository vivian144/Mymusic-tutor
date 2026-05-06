const registerValidation = (req, res, next) => {
  const { fullName, email, password, phone, role } = req.body;
  const errors = [];

  if (!fullName?.trim()) errors.push('Full name is required');

  if (!email?.trim()) errors.push('Email is required');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');

  if (!password) {
    errors.push('Password is required');
  } else {
    // FIX 4: strong password rules (also prevents bcrypt DoS via 128-char max)
    if (password.length < 8)   errors.push('Password must be at least 8 characters');
    if (password.length > 128) errors.push('Password must not exceed 128 characters');
    if (/\s/.test(password))   errors.push('Password must not contain spaces');
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least one lowercase letter');
    if (!/\d/.test(password))    errors.push('Password must contain at least one number');
    if (!/[!@#$%^&*]/.test(password)) errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  if (!phone?.trim()) errors.push('Phone number is required');
  else if (!/^[6-9]\d{9}$/.test(phone.replace(/[\s\-]/g, ''))) errors.push('Invalid Indian phone number (10 digits starting with 6-9)');

  if (!role) errors.push('Role is required');
  else if (!['student', 'teacher'].includes(role)) errors.push('Role must be student or teacher');

  if (role === 'teacher') {
    const { instruments, hourlyRate, certificateType, highestGrade, certificateUrl,
            experienceProofUrl, experience, teachingMode } = req.body;

    if (!instruments?.length) errors.push('At least one instrument is required for teachers');
    if (!hourlyRate || isNaN(hourlyRate) || Number(hourlyRate) <= 0) errors.push('Valid hourly rate is required for teachers');

    if (!certificateType) {
      errors.push('Certificate type is required for teachers');
    } else if (!['trinity', 'rockschool', 'experience_based'].includes(certificateType)) {
      errors.push("Certificate type must be 'trinity', 'rockschool', or 'experience_based'");
    } else if (certificateType === 'experience_based') {
      if (!experienceProofUrl?.trim()) errors.push('Experience proof document URL is required for experience-based teachers');
      if (!experience || isNaN(experience) || Number(experience) < 2) errors.push('Minimum 2 years of experience is required for experience-based teachers');
    } else {
      if (!highestGrade || isNaN(highestGrade)) errors.push('Highest grade is required for Trinity/Rockschool certified teachers');
      if (!certificateUrl?.trim()) errors.push('Certificate URL is required for Trinity/Rockschool certified teachers');
    }

    if (teachingMode && !['offline', 'online', 'both'].includes(teachingMode)) {
      errors.push("Teaching mode must be 'offline', 'online', or 'both'");
    }
  }

  if (role === 'student') {
    const { learningGoal } = req.body;
    if (!learningGoal) errors.push('Learning goal is required for students');
    else if (!['grades', 'hobby'].includes(learningGoal)) errors.push("Learning goal must be 'grades' or 'hobby'");
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

const loginValidation = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email?.trim()) errors.push('Email is required');
  if (!password)      errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  next();
};

module.exports = { registerValidation, loginValidation };
