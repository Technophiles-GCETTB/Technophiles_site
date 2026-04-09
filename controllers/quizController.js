const { Quiz, QuizAttempt } = require('../models/Quiz');
const User = require('../models/User');
const { PointsTransaction, Notification } = require('../models/index');

// ─── List Quizzes ─────────────────────────────────────────────────────────────
exports.listQuizzes = async (req, res) => {
  try {
    const filter = { status: 'published' };
    if (req.user.role === 'external') {
      filter.accessLevel = 'all';
    }
    const quizzes = await Quiz.find(filter).populate('createdBy', 'name').sort({ createdAt: -1 });
    const myAttempts = await QuizAttempt.find({ user: req.user._id }).select('quiz');
    const attemptedIds = myAttempts.map(a => a.quiz.toString());

    res.render('quiz/list', {
      title: 'Quizzes - Technophiles',
      quizzes, attemptedIds, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
};

// ─── Get Quiz Detail ──────────────────────────────────────────────────────────
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('createdBy', 'name');
    if (!quiz) return res.status(404).render('404', { title: '404' });

    const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id, user: req.user._id });
    const canAttempt = attemptCount < quiz.maxAttempts;

    res.render('quiz/detail', {
      title: quiz.title,
      quiz, canAttempt, attemptCount, user: req.user
    });
  } catch (err) {
    res.redirect('/quiz');
  }
};

// ─── Start Quiz (GET) ─────────────────────────────────────────────────────────
exports.startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz || quiz.status !== 'published') return res.redirect('/quiz');

    const attemptCount = await QuizAttempt.countDocuments({ quiz: quiz._id, user: req.user._id });
    if (attemptCount >= quiz.maxAttempts) {
      return res.redirect(`/quiz/${quiz._id}?msg=max_attempts`);
    }

    // Shuffle questions/options if enabled
    let questions = [...quiz.questions];
    if (quiz.shuffleQuestions) {
      questions = questions.sort(() => Math.random() - 0.5);
    }
    if (quiz.shuffleOptions) {
      questions = questions.map(q => ({
        ...q.toObject(),
        options: [...q.options].sort(() => Math.random() - 0.5)
      }));
    }

    res.render('quiz/attempt', {
      title: `${quiz.title} - Attempt`,
      quiz: { ...quiz.toObject(), questions },
      startTime: Date.now(),
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/quiz');
  }
};

// ─── Submit Quiz (POST) ───────────────────────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.redirect('/quiz');

    const { answers, startTime } = req.body;
    const timeTaken = Math.floor((Date.now() - parseInt(startTime)) / 1000);

    let totalScore = 0;
    const processedAnswers = quiz.questions.map((question, index) => {
      const selectedOptionIndex = answers ? parseInt(answers[question._id]) : -1;
      let isCorrect = false;
      let marksObtained = 0;

      if (selectedOptionIndex >= 0) {
        isCorrect = question.options[selectedOptionIndex]?.isCorrect === true;
        if (isCorrect) {
          marksObtained = question.marks;
          totalScore += marksObtained;
        }
      }

      return {
        question: question._id,
        selectedOption: selectedOptionIndex,
        isCorrect,
        marksObtained
      };
    });

    const percentage = quiz.totalMarks > 0 ? Math.round((totalScore / quiz.totalMarks) * 100) : 0;
    const isPassed = totalScore >= quiz.passingMarks;
    const pointsEarned = isPassed ? quiz.pointsReward : Math.floor(quiz.pointsReward * 0.3);

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user._id,
      answers: processedAnswers,
      totalScore,
      percentage,
      isPassed,
      timeTaken,
      submittedAt: new Date(),
      pointsEarned
    });

    // Award points
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });
    await PointsTransaction.create({
      user: req.user._id,
      points: pointsEarned,
      type: 'quiz_completion',
      description: `Completed quiz: ${quiz.title} (${percentage}%)`,
      reference: quiz._id,
      referenceModel: 'Quiz'
    });

    const { notify } = require('../utils/notify');
    await notify({
      recipient: req.user._id,
      type: 'quiz_result',
      title: `Quiz Result: ${quiz.title}`,
      message: `You scored ${totalScore}/${quiz.totalMarks} (${percentage}%) - ${isPassed ? 'PASSED ✓' : 'Failed'}`,
      link: `/quiz/${quiz._id}/result/${attempt._id}`
    });

    if (quiz.showResultImmediately) {
      res.redirect(`/quiz/${quiz._id}/result/${attempt._id}`);
    } else {
      res.render('quiz/submitted', { title: 'Quiz Submitted', quiz, user: req.user });
    }
  } catch (err) {
    console.error(err);
    res.redirect('/quiz');
  }
};

// ─── Quiz Result ──────────────────────────────────────────────────────────────
exports.getResult = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId).populate('quiz');
    if (!attempt || attempt.user.toString() !== req.user._id.toString()) {
      return res.redirect('/quiz');
    }

    const quiz = await Quiz.findById(attempt.quiz._id);

    // Map answers with question data
    const results = quiz.questions.map(q => {
      const ans = attempt.answers.find(a => a.question.toString() === q._id.toString());
      return {
        question: q.question,
        options: q.options,
        selectedOption: ans ? ans.selectedOption : -1,
        isCorrect: ans ? ans.isCorrect : false,
        marksObtained: ans ? ans.marksObtained : 0,
        marks: q.marks,
        explanation: q.explanation
      };
    });

    res.render('quiz/result', {
      title: `Quiz Result - ${quiz.title}`,
      attempt, quiz, results, user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/quiz');
  }
};

// ─── Create Quiz (Admin) ──────────────────────────────────────────────────────
exports.getCreateQuiz = (req, res) => {
  res.render('quiz/create', { title: 'Create Quiz', quiz: null, user: req.user });
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, duration, maxAttempts, pointsReward, accessLevel } = req.body;

    // Parse questions from form
    const questions = [];
    const questionTexts = [].concat(req.body['questions[][question]'] || []);
    
    for (let i = 0; i < questionTexts.length; i++) {
      const opts = [
        req.body[`questions[${i}][options][0]`],
        req.body[`questions[${i}][options][1]`],
        req.body[`questions[${i}][options][2]`],
        req.body[`questions[${i}][options][3]`],
      ].filter(Boolean);

      const correctIndex = parseInt(req.body[`questions[${i}][correct]`]) || 0;

      questions.push({
        question: questionTexts[i],
        options: opts.map((text, idx) => ({ text, isCorrect: idx === correctIndex })),
        marks: parseInt(req.body[`questions[${i}][marks]`]) || 1,
        explanation: req.body[`questions[${i}][explanation]`]
      });
    }

    const quiz = await Quiz.create({
      title, description,
      duration: parseInt(duration) || 30,
      maxAttempts: parseInt(maxAttempts) || 1,
      pointsReward: parseInt(pointsReward) || 20,
      accessLevel: accessLevel || 'internal_only',
      questions,
      status: 'published',
      createdBy: req.user._id
    });

    res.redirect(`/quiz/${quiz._id}`);
  } catch (err) {
    console.error(err);
    res.render('quiz/create', { title: 'Create Quiz', error: err.message, quiz: req.body, user: req.user });
  }
};

// ─── Quiz Scoreboard ──────────────────────────────────────────────────────────
exports.getScoreboard = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    const attempts = await QuizAttempt.find({ quiz: quiz._id })
      .populate('user', 'name avatar')
      .sort({ totalScore: -1, timeTaken: 1 })
      .limit(50);

    res.render('quiz/scoreboard', {
      title: `${quiz.title} - Scoreboard`,
      quiz, attempts, user: req.user
    });
  } catch (err) {
    res.redirect('/quiz');
  }
};
