const { Package, Booking, Provider, sequelize } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');

function activeLimitedTimeFilter(now = new Date()) {
  return {
    [Op.or]: [
      { is_limited_time: false },
      { is_limited_time: null },
      { offer_ends_at: null },
      { offer_ends_at: { [Op.gt]: now } }
    ]
  };
}

/**
 * Weighted Attribute Scoring (WAS) for Personalized Recommendations
 */
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const travelerId = req.user.id; // From authenticate middleware

    // 1. Fetch User Booking History
    const bookings = await Booking.findAll({
      where: { traveler_id: travelerId, booking_type: 'PACKAGE' },
      include: [{ model: Package, as: 'package' }]
    });

    let recommendations = [];
    let insight = null;

    if (bookings.length > 0) {
      // 2. Build User Preference Vector
      const stats = {
        destinations: {},
        types: {},
        mediums: {},
        prices: []
      };

      bookings.forEach(b => {
        if (b.package) {
          const p = b.package;
          stats.destinations[p.destination] = (stats.destinations[p.destination] || 0) + 1;
          stats.types[p.package_type] = (stats.types[p.package_type] || 0) + 1;
          stats.mediums[p.travel_medium] = (stats.mediums[p.travel_medium] || 0) + 1;
          stats.prices.push(Number(p.price));
        }
      });

      const avgPrice = stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length;
      const bookedPackageIds = bookings.map(b => b.package_id);

      // 3. Fetch Candidate Packages (Travel Packages from Agencies, excluding custom requests)
      const candidatesRaw = await Package.findAll({
        where: {
          status: 'APPROVED',
          package_id: { [Op.notIn]: bookedPackageIds },
          ...activeLimitedTimeFilter()
        },
        include: [{ 
          model: Provider, 
          as: 'provider',
          where: { provider_type: 'AGENCY' } 
        }]
      });

      // Filter out custom-request JSON descriptions
      const candidates = candidatesRaw.filter(pkg => {
        try {
          const meta = typeof pkg.description === 'string' ? JSON.parse(pkg.description) : pkg.description;
          return !(meta && meta.isCustomRequest === true);
        } catch {
          return true;
        }
      });

      // 4. Score Candidates
      const scored = candidates.map(pkg => {
        let score = 0;
        
        // Destination Match (Weight: 0.4)
        if (stats.destinations[pkg.destination]) score += 0.4;
        
        // Type Match (Weight: 0.2)
        if (stats.types[pkg.package_type]) score += 0.2;
        
        // Medium Match (Weight: 0.1)
        if (stats.mediums[pkg.travel_medium]) score += 0.1;
        
        // Price Proximity (Weight: 0.3)
        const priceDiff = Math.abs(Number(pkg.price) - avgPrice);
        const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
        score += priceScore * 0.3;

        return { package: pkg, score };
      });

      // Sort by score and take top 5
      recommendations = scored
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(s => s.package);

    } else {
      // 5. Popularity Fallback (Cold-Start)
      // Get most booked packages in the system (Agency only)
      const popular = await Booking.findAll({
        where: { booking_type: 'PACKAGE' },
        attributes: [
          'package_id',
          [sequelize.fn('COUNT', sequelize.col('package_id')), 'bookingCount']
        ],
        group: ['package_id'],
        order: [[sequelize.literal('bookingCount'), 'DESC']],
        limit: 10, // Fetch more to filter
        include: [{ 
          model: Package, 
          as: 'package', 
          where: { status: 'APPROVED', ...activeLimitedTimeFilter() },
          include: [{ model: Provider, as: 'provider', where: { provider_type: 'AGENCY' } }]
        }]
      });

      recommendations = popular
        .map(p => p.package)
        .filter(pkg => {
          if (!pkg) return false;
          try {
            const meta = typeof pkg.description === 'string' ? JSON.parse(pkg.description) : pkg.description;
            return !(meta && meta.isCustomRequest === true);
          } catch {
            return true;
          }
        })
        .slice(0, 5);

      // If still empty, just return latest agency packages
      if (recommendations.length === 0) {
        const latestRaw = await Package.findAll({
          where: { status: 'APPROVED', ...activeLimitedTimeFilter() },
          include: [{ model: Provider, as: 'provider', where: { provider_type: 'AGENCY' } }],
          order: [['created_at', 'DESC']],
          limit: 10
        });

        recommendations = latestRaw
          .filter(pkg => {
            try {
              const meta = typeof pkg.description === 'string' ? JSON.parse(pkg.description) : pkg.description;
              return !(meta && meta.isCustomRequest === true);
            } catch {
              return true;
            }
          })
          .slice(0, 5);
      }
    }

    // 6. Generate AI Insight for the top recommendation
    if (recommendations.length > 0) {
      try {
        const topOne = recommendations[0];
        const apiKey = process.env.GROQ_API_KEY;
        
        if (apiKey) {
          const sysPrompt = `You are "Gojo Sensei", a travel expert. Keep it very short (max 20 words). 
          Explain why this package is perfect for ${req.user.name}. 
          Previous history count: ${bookings.length}. Destination: ${topOne.destination}.`;
          
          const aiRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: sysPrompt },
              { role: 'user', content: `Suggest package: ${topOne.title}` }
            ],
            max_tokens: 50
          }, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          
          insight = aiRes.data.choices[0].message.content;
        }
      } catch (err) {
        console.error('AI Insight Error:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        recommendations,
        insight
      }
    });

  } catch (error) {
    console.error('Recommendation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
};
