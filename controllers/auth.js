const User = require("../models/User");

//@desc     Register user
//@route    POST /api/auth/register
//@access   Public
exports.register = async (req, res, next) => {
	try {
		const { name, email, telephoneNumber, password, role } = req.body;

		// Create user
		const user = await User.create({
			name,
			email,
			telephoneNumber,
			password,
			role,
		});

		// Create token
		// const token = user.getSignedJwtToken();
		// res.status(200).json({ success: true, token });
		sendTokenResponse(user, 200, res);
	} catch (error) {
		res.status(400).json({ success: false });
		console.log(error.stack);
	}
};

//@desc     Login user
//@route    POST /api/auth/login
//@access   Public
exports.login = async (req, res, next) => {
	const { email, password } = req.body;

	// Validate email and password
	if (!email || !password) {
		return res.status(400).json({
			success: false,
			msg: "Please provide and email and password",
		});
	}

	// Check for user
	const user = await User.findOne({ email }).select("+password");
	if (!user) {
		return res
			.status(400)
			.json({ success: false, msg: "Invalid credentials" });
	}

	// Check if password matches
	const isMatch = await user.matchPassword(password);

	if (!isMatch) {
		return res
			.status(401)
			.json({ success: false, msg: "Invalid credentials" });
	}

	// Create token
	// const token = user.getSignedJwtToken();
	// res.status(200).json({ success: true, token });
	sendTokenResponse(user, 200, res);
};

const sendTokenResponse = (user, statusCode, res) => {
	// Create token
	const token = user.getSignedJwtToken();

	const options = {
		expires: new Date(
			Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === "production") {
		options.secure = true;
	}

	res.status(statusCode).cookie("token", token, options).json({
		success: true,
		token,
	});
};

//@desc     Get current Logged in user
//@route    POST /api/auth/me
//@access   Private
exports.getMe = async (req, res, next) => {
	
	//protect
	const user = await User.findById(req.user.id);
	res.status(200).json({
		success: true,
		data: user,
	});
};


//@desc Log user out / clear cookie
//@route GET /api/auth/logout
//@access Private
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({
        success: true,
        data: {}
    });
};