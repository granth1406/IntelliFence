// Get user's own reports
async function getUserReports(req, res) {
  try {
    const { status, incidentType, limit = 20, offset = 0 } = req.query;

    let query = { createdBy: req.user.id };

    if (status && status !== "all") {
      query.status = status;
    }

    if (incidentType && incidentType !== "all") {
      query.incidentType = incidentType;
    }

    const total = await Zone.countDocuments(query);
    const reports = await Zone.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate("createdBy", "name email")
      .lean();

    res.status(200).json({
      reports,
      total,
      hasMore: total > parseInt(offset) + parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
