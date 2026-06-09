import { Request, Response } from "express";
import Incident from "../models/Incident";
import Comment from "../models/Comment";

export const commentOnReport = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const { commenterName, comment } = req.body;

    if (!commenterName?.trim() || !comment?.trim()) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const report = await Incident.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    const newComment = new Comment({
      commenterName,
      comment,
      incident: report._id,
    });
    await newComment.save();

    report.comments.push(newComment._id);
    await report.save();

    return res.status(201).json(newComment);
  
  } catch (error) {
    console.error('createIncident error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const getReportComments = async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const report = await Incident.findById(reportId).populate('comments');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    return res.status(200).json(report.comments);
  } catch (error) {
    console.error('createIncident error:', error);
    res.status(500).json({ message: 'Internal server error' });    
  }
}