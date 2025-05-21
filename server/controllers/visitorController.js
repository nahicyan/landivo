// server/controllers/visitorController.js
import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

/**
 * Track a visitor page view
 * @route POST /api/visitors/track
 * @access Public
 */
export const trackVisit = asyncHandler(async (req, res) => {
  const { visitorId, sessionId, page, referrer, screenSize, previousSessionEnd } = req.body;
  
  if (!visitorId || !sessionId || !page) {
    return res.status(400).json({ message: "Missing required tracking parameters" });
  }
  
  try {
    // Get IP and user agent
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || '';
    const userAgent = req.headers['user-agent'] || '';
    
    // Determine device type from user agent
    const isMobile = /mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent);
    const isTablet = /ipad|tablet/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';
    
    // Check if visitor exists
    let visitor = await prisma.visitor.findUnique({
      where: { visitorId }
    });
    
    const isNewVisitor = !visitor;
    
    if (isNewVisitor) {
      // Create new visitor
      visitor = await prisma.visitor.create({
        data: {
          visitorId,
          firstVisit: new Date(),
          lastVisit: new Date(),
          totalVisits: 1,
          deviceType,
          browser: userAgent.includes('Chrome') ? 'Chrome' : 
                  userAgent.includes('Firefox') ? 'Firefox' : 
                  userAgent.includes('Safari') ? 'Safari' : 
                  userAgent.includes('Edge') ? 'Edge' : 'Other',
          os: userAgent.includes('Windows') ? 'Windows' : 
             userAgent.includes('Mac') ? 'Mac' : 
             userAgent.includes('Linux') ? 'Linux' : 
             userAgent.includes('Android') ? 'Android' : 
             userAgent.includes('iOS') ? 'iOS' : 'Other',
        }
      });
    } else {
      // Update existing visitor
      visitor = await prisma.visitor.update({
        where: { visitorId },
        data: {
          lastVisit: new Date(),
          totalVisits: { increment: 1 }
        }
      });
    }
    
    // Check if we need to close previous session
    if (previousSessionEnd && sessionId) {
      try {
        const existingVisit = await prisma.visit.findFirst({
          where: { sessionId }
        });
        
        if (existingVisit && !existingVisit.endTime) {
          const endTime = new Date(previousSessionEnd);
          const startTime = new Date(existingVisit.startTime);
          const durationSec = Math.floor((endTime - startTime) / 1000);
          
          await prisma.visit.update({
            where: { id: existingVisit.id },
            data: {
              endTime,
              duration: durationSec > 0 ? durationSec : 0,
              exitPage: page
            }
          });
        }
      } catch (err) {
        console.error("Error updating previous session:", err);
      }
    }
    
    // Create or update visit record
    let visit;
    try {
      // First try to find an existing visit for this session
      const existingVisit = await prisma.visit.findFirst({
        where: { 
          sessionId,
          visitorId: visitor.visitorId
        }
      });
      
      if (existingVisit) {
        // Update existing visit
        visit = await prisma.visit.update({
          where: { id: existingVisit.id },
          data: {
            pagesViewed: { increment: 1 },
            exitPage: page
          }
        });
      } else {
        // Create new visit
        visit = await prisma.visit.create({
          data: {
            visitorId: visitor.visitorId,
            sessionId,
            startTime: new Date(),
            entryPage: page,
            exitPage: page,
            referrer: referrer || null,
            userAgent,
            ipAddress: ip,
            screenSize
          }
        });
      }
    } catch (err) {
      console.error("Error creating/updating visit:", err);
    }
    
    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // First try to find today's stats
    let todayStats = await prisma.visitorStat.findUnique({
      where: { date: today }
    });
    
    if (todayStats) {
      // Update existing stats
      await prisma.visitorStat.update({
        where: { id: todayStats.id },
        data: {
          uniqueVisitors: isNewVisitor ? { increment: 1 } : undefined,
          totalVisits: { increment: 1 },
          newVisitors: isNewVisitor ? { increment: 1 } : undefined,
          returningVisitors: isNewVisitor ? undefined : { increment: 1 },
          updatedAt: new Date()
        }
      });
    } else {
      // Create new stats for today
      await prisma.visitorStat.create({
        data: {
          date: today,
          uniqueVisitors: 1,
          totalVisits: 1,
          newVisitors: isNewVisitor ? 1 : 0,
          returningVisitors: isNewVisitor ? 0 : 1
        }
      });
    }
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking visit:", error);
    // Return success anyway to not interrupt user experience
    res.status(200).json({ success: true });
  }
});

/**
 * Get visitor statistics for dashboard
 * @route GET /api/visitors/stats
 * @access Private (Admin only)
 */
export const getVisitorStats = asyncHandler(async (req, res) => {
  const { period = 'week', startDate, endDate } = req.query;
  
  try {
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      end.setHours(23, 59, 59, 999);
      
      start = new Date(end);
      switch (period) {
        case 'day': start.setDate(start.getDate() - 1); break;
        case 'week': start.setDate(start.getDate() - 7); break;
        case 'month': start.setMonth(start.getMonth() - 1); break;
        case 'year': start.setFullYear(start.getFullYear() - 1); break;
        default: start.setDate(start.getDate() - 7);
      }
      start.setHours(0, 0, 0, 0);
    }
    
    // Get daily stats
    const stats = await prisma.visitorStat.findMany({
      where: {
        date: { gte: start, lte: end }
      },
      orderBy: { date: 'asc' }
    });
    
    // Get current period totals
    const currentPeriodStats = await prisma.visitorStat.aggregate({
      where: { date: { gte: start, lte: end } },
      _sum: {
        uniqueVisitors: true,
        totalVisits: true,
        newVisitors: true,
        returningVisitors: true
      }
    });
    
    // Get previous period stats
    const periodDuration = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodDuration);
    
    const previousPeriodStats = await prisma.visitorStat.aggregate({
      where: { date: { gte: prevStart, lte: prevEnd } },
      _sum: {
        uniqueVisitors: true,
        totalVisits: true,
        newVisitors: true,
        returningVisitors: true
      }
    });
    
    // Get top pages - Updated to handle property pages better
    const topPages = await prisma.visit.groupBy({
      by: ['entryPage'],
      where: { startTime: { gte: start, lte: end } },
      _count: { entryPage: true },
      orderBy: { _count: { entryPage: 'desc' } },
      take: 10
    });
    
    // Process top pages to properly handle property pages
    const processedTopPages = await Promise.all(topPages.map(async p => {
      // Check if this is a property page with an ID
      if (p.entryPage.startsWith('/properties/') && p.entryPage.length > 12) {
        const propertyId = p.entryPage.split('/').pop();
        
        // Try to get property info to enhance the display (title if available)
        let propertyInfo = null;
        try {
          propertyInfo = await prisma.residency.findUnique({
            where: { id: propertyId },
            select: { title: true, streetAddress: true }
          });
        } catch (err) {
          console.log("Property not found for ID:", propertyId);
        }
        
        return {
          page: p.entryPage,
          count: p._count.entryPage,
          isProperty: true,
          propertyId,
          propertyTitle: propertyInfo?.title || 'Unknown Property',
          propertyAddress: propertyInfo?.streetAddress || ''
        };
      }
      
      return {
        page: p.entryPage,
        count: p._count.entryPage,
        isProperty: false
      };
    }));
    
    // Get device breakdown
    const deviceBreakdown = await prisma.visitor.groupBy({
      by: ['deviceType'],
      where: { lastVisit: { gte: start, lte: end } },
      _count: { visitorId: true }
    });
    
    // Get page performance details
    const pagePerformance = await Promise.all(
      processedTopPages.slice(0, 5).map(async page => {
        // Count unique visitors for this page
        const uniqueVisitors = await prisma.visit.findMany({
          where: {
            entryPage: page.page,
            startTime: { gte: start, lte: end }
          },
          distinct: ['visitorId']
        });
        
        // Calculate average visit duration for this page
        const pageDurations = await prisma.visit.findMany({
          where: {
            entryPage: page.page,
            startTime: { gte: start, lte: end },
            duration: { not: null }
          },
          select: { duration: true }
        });
        
        const totalDuration = pageDurations.reduce((sum, visit) => sum + (visit.duration || 0), 0);
        const avgDuration = pageDurations.length > 0 ? totalDuration / pageDurations.length : 0;
        
        // Calculate bounce rate (visits with just 1 page view)
        const singlePageVisits = await prisma.visit.count({
          where: {
            entryPage: page.page,
            startTime: { gte: start, lte: end },
            pagesViewed: 1
          }
        });
        
        const bounceRate = page.count > 0 ? Math.round((singlePageVisits / page.count) * 100) : 0;
        
        return {
          ...page,
          uniqueVisitors: uniqueVisitors.length,
          avgDuration: Math.round(avgDuration / 60), // Convert to minutes
          bounceRate
        };
      })
    );
    
    res.status(200).json({
      dailyStats: stats,
      currentPeriod: {
        uniqueVisitors: currentPeriodStats._sum.uniqueVisitors || 0,
        totalVisits: currentPeriodStats._sum.totalVisits || 0,
        newVisitors: currentPeriodStats._sum.newVisitors || 0,
        returningVisitors: currentPeriodStats._sum.returningVisitors || 0
      },
      previousPeriod: {
        uniqueVisitors: previousPeriodStats._sum.uniqueVisitors || 0,
        totalVisits: previousPeriodStats._sum.totalVisits || 0,
        newVisitors: previousPeriodStats._sum.newVisitors || 0,
        returningVisitors: previousPeriodStats._sum.returningVisitors || 0
      },
      topPages: processedTopPages,
      pagePerformance,
      deviceBreakdown: deviceBreakdown.map(d => ({
        device: d.deviceType || 'unknown',
        count: d._count.visitorId
      }))
    });
  } catch (error) {
    console.error("Error fetching visitor stats:", error);
    res.status(500).json({
      message: "An error occurred while fetching visitor statistics",
      error: error.message
    });
  }
});

/**
 * Get current visitor count
 * @route GET /api/visitors/current
 * @access Private (Admin only)
 */
export const getCurrentVisitors = asyncHandler(async (req, res) => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Use findMany with distinct instead, then count the results
    const activeVisits = await prisma.visit.findMany({
      where: {
        OR: [
          { startTime: { gte: fiveMinutesAgo } },
          { endTime: { gte: fiveMinutesAgo } }
        ]
      },
      distinct: ['visitorId']
    });
    
    // Count the unique visitors
    const uniqueVisitorCount = activeVisits.length;
    
    res.status(200).json({ currentVisitors: uniqueVisitorCount });
  } catch (error) {
    console.error("Error fetching current visitors:", error);
    res.status(500).json({
      message: "An error occurred while fetching current visitor count",
      error: error.message
    });
  }
});